'use strict';

const Homey = require('homey');
const { OctoprintAPI } = require('../../lib/octoprint.js');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class OctoprintDevice extends Homey.Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this._driver = this.getDriver();

    this.octoprint = new OctoprintAPI({
      address: this.getSetting('address'),
      port: this.getSetting('port'),
      ssl: this.getSetting('ssl'),
      apikey: this.getSetting('apikey')
    });

    this.setAvailable();

    this.printer = {
      server: null,
      state: {
        old: null,
        cur: 'Offline'
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
        completion: '0',
        estimate: '0',
        time: '0',
        left: '0'
      }
    };

    this.registerCapabilityListener('onoff', async (value,opts) => {
      if ( false == value ) {
        // Don't set off while printing.
        if ( 'Printing' !== this.printer.state.cur ) {
          this.octoprint.postData('/api/connection', {command:'disconnect'});
        }
      } else {
        this.octoprint.postData('/api/connection', {command:'connect'});
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
    this.log('Octoprint has been added');
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
    this.log('Octoprint settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('Octoprint was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
		this.polling = false;
  }


	async pollDevice() {
		while ( this.polling ) {

      this.printer.server = await this.octoprint.getServerState();

      if ( this.printer.server ) {

        this.printer.state.old = this.printer.state.cur;
        this.printer.state.cur = await this.octoprint.getPrinterState();

        // Printer connected?
        if ('Offline' == this.printer.state.cur ) {
          if ( true == this.getCapabilityValue('onoff') ) { // Trigger off if not already set.
            await this.setCapabilityValue('onoff', false).catch(error => this.log(error));
          }

        } else {
          if ( false == this.getCapabilityValue('onoff') ) { // Trigger on if not already set.
            await this.setCapabilityValue('onoff', true).catch(error => this.log(error));
          }
        }


        if ( 'Offline' !== this.printer.state.cur ) {
          // Printer temps
          this.printer.temp = await this.octoprint.getPrinterTemps();
          await this.setCapabilityValue('printer_temp_bed', this.printer.temp.bed.actual);
          await this.setCapabilityValue('printer_temp_tool', this.printer.temp.tool0.actual);

          // Print job
          this.printer.job = await this.octoprint.getPrinterJob();
          await this.setCapabilityValue('job_completion', this.printer.job.completion);
          await this.setCapabilityValue('job_estimate', this.printer.job.estimate);
          await this.setCapabilityValue('job_time', this.printer.job.time);
          await this.setCapabilityValue('job_left', this.printer.job.left);

          // State changes
          if ( this.printer.state.old !== this.printer.state.cur ) {
            await this.setCapabilityValue('printer_state', this.translateString(this.printer.state.cur));

            // Take snapshot on printer state change.
            this.printer.snapshot = await this.snapshotImage();

            this._driver.ready(() => {
              let tokens = {
                'snapshot': this.printer.snapshot,
                'estimate': this.printer.job.estimate,
                'duration': this.printer.job.time
              };

              if ( 'Printing' == this.printer.state.cur ) {
                this._driver.triggerPrintStarted(this, tokens);
              }

              if ( 'Printing' == this.printer.state.old ) {
                this._driver.triggerPrintFinished(this, tokens);
              }
            });
          }
        }

      } else {
        this.log('Server unreachable');
      }

      let pollInterval = Homey.ManagerSettings.get('pollInterval') >= 10 ? Homey.ManagerSettings.get('pollInterval') : 10;
      await delay(pollInterval*1000);
    }
	}


  async snapshotImage() {
    this.snapshot = new Homey.Image();
    this.snapshot.setStream(async (stream) => {
      const res = await this.octoprint.getSnapshot(this.getSetting('snapshot_url'));
      if(!res.ok) throw new Error(res.statusText);
      return res.body.pipe(stream);
    });

    return this.snapshot.register().catch(console.error);
  }


  translateString(string) {
    switch(string) {
      case 'Offline':
        return Homey.__("states.offline");
      case 'Operational':
        return Homey.__("states.operational");
      case 'Closed':
        return Homey.__("states.closed");
      default:
        return '-';
    }
  }
}

module.exports = OctoprintDevice;
