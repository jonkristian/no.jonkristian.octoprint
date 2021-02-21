'use strict';

const Homey = require('homey');
const { OctoprintAPI } = require('../../lib/octoprint.js');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class OctoprintDevice extends Homey.Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.octoprint = new OctoprintAPI({
      address: this.getSetting('address'),
      apikey: this.getSetting('apikey')
    });

    this.printer = {
      server: null,
      state: {
        old: null,
        cur: 'Closed'
      },
      snapshot: null,
      temp: {
        bed: {
          actual: 0
        },
        tool0: {
          actual: 0
        }
      },
      job: {
        completion: '-',
        estimate: '-',
        time: '-',
        left: '-'
      }
    };

    let snapshot = await this.snapshotImage();
    let snapshotToken = await this.homey.flow.createToken('octoprint_snapshot', {
      type: 'image',
      title: 'Snapshot'
    });
    await snapshotToken.setValue(snapshot);

    this.homey.flow.getConditionCard('is_printing')
    .registerRunListener(async (args, state) => {
      return ('Printing' == this.printer.state.cur) ? true : false;
    });

    this.registerCapabilityListener('job_pause', async (value) => {
      if ( true == value && 'Printing' == this.printer.state.cur ) {
        await this.octoprint.postData('/api/job', {"command": "pause", "action": "pause"});
      }
    });

    this.registerCapabilityListener('job_resume', async (value) => {
      if ( true == value && 'Paused' == this.printer.state.cur ) {
        this.octoprint.postData('/api/job', {"command": "pause", "action": "resume"});
      }
    });

    this.registerCapabilityListener('job_cancel', async (value) => {
      if ( true == value && 'Printing' == this.printer.state.cur || 'Paused' == this.printer.state.cur ) {
        this.octoprint.postData('/api/job', {command:'cancel'});

        // We don't have a proper state for 'cancelled' so we just reset caps here.
        await this.setCapabilityValue('job_pause', false).catch(error => this.log(error));
        await this.setCapabilityValue('job_resume', false).catch(error => this.log(error));
      }
    });


    this.registerCapabilityListener('onoff', async (value) => {
      if ( 'Operational' !== this.printer.state.cur ) {
        throw new Error( this.homey.__('error.onoff_state', { state: this.printer.state.cur }) );
      } else {
        if ( false == value ) {
          this.octoprint.postData('/api/connection', {command:'disconnect'});
        } else {
          this.octoprint.postData('/api/connection', {command:'connect'});
        }
      }
    });


    this.addListener('poll', this.pollDevice);
    this.polling = true;
    this.emit('poll');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('OctoPrint device added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('OctoPrint settings changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('OctoPrint device renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.log('OctoPrint device removed');
		this.polling = false;
  }


	async pollDevice() {
		while ( this.polling ) {

      this.printer.server = await this.octoprint.getServerState();

      if ( false == this.printer.server ) {

        this.setUnavailable();
        this.log('Server unreachable');

      } else {

        this.setAvailable();

        this.printer.state.old = this.printer.state.cur;
        this.printer.state.cur = await this.octoprint.getPrinterState();

        // Set printer temps and job when connected.
        if ( 'Closed' !== this.printer.state.cur ) {
          await this.setPrinterTemps();
          await this.setPrinterJobState();
        }

        // Triggered only when state changes.
        if ( this.printer.state.old !== this.printer.state.cur ) {

          await this.setCapabilityValue('printer_state', this.translateString(this.printer.state.cur));

          // Printer connected?
          if ('Closed' == this.printer.state.cur ) {
            // Trigger 'off' if not already set.
            if ( true == this.getCapabilityValue('onoff') ) {
              await this.setCapabilityValue('onoff', false).catch(error => this.log(error));
            }

          } else {

            // Trigger 'on' if not already set.
            if ( false == this.getCapabilityValue('onoff') ) {
              await this.setCapabilityValue('onoff', true).catch(error => this.log(error));
            }
          }

          // Started Printing?
          if ( 'Printing' == this.printer.state.cur ) {
            await this.setCapabilityValue('job_pause', false).catch(error => this.log(error));
            await this.setCapabilityValue('job_cancel', false).catch(error => this.log(error));

            let state = {};
            let tokens = {
              'print_started_estimate': this.printer.job.estimate
            };

            this.driver.triggerPrintStarted(this, tokens, state);
          }

          // Started Pausing or Paused from printing?
          if ( 'Printing' == this.printer.state.old && 'Pausing' == this.printer.state.old || 'Paused' == this.printer.state.cur ) {
            
            // this.log('Print paused');
            await this.setCapabilityValue('job_cancel', false).catch(error => this.log(error));
            await this.setCapabilityValue('job_resume', false).catch(error => this.log(error));

            let state = {};
            let tokens = {
              'print_paused_estimate': this.printer.job.estimate,
              'print_paused_time': this.printer.job.time,
              'print_paused_left': this.printer.job.left
            };

            this.driver.triggerPrintPaused(this, tokens, state);
          }

          // Finished?
          if ( 'Printing' == this.printer.state.old && 'Operational' == this.printer.state.cur ) {

            // this.log('Print finished');
            await this.setCapabilityValue('job_pause', false).catch(error => this.log(error));
            await this.setCapabilityValue('job_cancel', false).catch(error => this.log(error));
            await this.setCapabilityValue('job_resume', false).catch(error => this.log(error));

            let state = {};
            let tokens = {
              'print_finished_estimate': this.printer.job.estimate,
              'print_finished_time': this.printer.job.time
            };

            this.driver.triggerPrintFinished(this, tokens, state);
          }

        }
      }

      let pollInterval = this.homey.settings.get('pollInterval') >= 10 ? this.homey.settings.get('pollInterval') : 10;
      await delay(pollInterval*1000);
    }
	}


  async snapshotImage() {
    this.snapshot = await this.homey.images.createImage();
    this.snapshot.setStream(async (stream) => {
      const res = await this.octoprint.getSnapshot(this.getSetting('snapshot_url'));
      if (!res.ok) {
        throw new Error( this.homey.__("error.snapshot_failed") );
      }
      return res.body.pipe(stream);
    });

    return this.snapshot;
  }


  async setPrinterTemps() {
    this.printer.temp = await this.octoprint.getPrinterTemps();
    await this.setCapabilityValue('printer_temp_bed', this.printer.temp.bed.actual);
    await this.setCapabilityValue('printer_temp_tool', this.printer.temp.tool0.actual);
  }


  async setPrinterJobState() {
    this.printer.job = await this.octoprint.getPrinterJob();
    await this.setCapabilityValue('job_completion', this.printer.job.completion);
    await this.setCapabilityValue('job_estimate', this.printer.job.estimate);
    await this.setCapabilityValue('job_time', this.printer.job.time);
    await this.setCapabilityValue('job_left', this.printer.job.left);
  }


  translateString(string) {
    switch(string) {
      case 'Offline':
        return this.homey.__("states.offline");
      case 'Operational':
        return this.homey.__("states.operational");
      case 'Closed':
        return this.homey.__("states.closed");
      case 'Printing':
        return this.homey.__("states.printing");
      case 'Paused':
        return this.homey.__("states.paused");
      case 'Detecting serial connection':
        return this.homey.__("states.detecting");
      default:
        return string;
    }
  }
}

module.exports = OctoprintDevice;
