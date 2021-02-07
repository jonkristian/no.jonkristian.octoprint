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
      port: this.getSetting('port'),
      ssl: this.getSetting('ssl'),
      apikey: this.getSetting('apikey')
    });

    this.setAvailable();

    this.printer = false;
    this.polling = false;

    this.addListener('poll', this.pollDevice);

    this.registerCapabilityListener('onoff', async (value,opts) => {
      let data;
      if ( false == value ) {
        // Don't set off while printing.
        if ( 'Closed' == this.printer ) {
          data = {command:'disconnect'};
          await this.octoprint.postData('/api/connection', data).catch(error => this.log(error));
        }
      } else {
        data = {command:'connect'};
        await this.octoprint.postData('/api/connection', data).catch(error => this.log(error));
      }
    });

    this.octoprint.getServerState()
    .then(result => {
      console.log('Server is up, so we can poll. v.', result);
      this.polling = true;
      this.emit('poll');
		})
		.catch(error => {
      this.log(error);
    });
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

      this.printer = await this.octoprint.getPrinterState();
      this.setCapabilityValue('printer_state', this.printer).catch(error => this.log(error));

      console.log('Printer state is', this.printer);

      // Printer connected?
      if ('Closed' == this.printer ) {
        // Trigger off if not already set.
        if ( true == this.getCapabilityValue('onoff') ) {
          await this.setCapabilityValue('onoff', false).catch(error => this.log(error));
        }
      // We're open so let's go ahead.
      } else {
        await this.setCapabilityValue('onoff', true).catch(error => this.log(error));

        // Printer operation state
        await this.octoprint.getData('/api/printer')
        .then(operation => {
          this.setCapabilityValue('printer_temp_bed', operation.temperature.bed.actual).catch(error => this.log(error));
          this.setCapabilityValue('printer_temp_tool', operation.temperature.tool0.actual).catch(error => this.log(error));
        });

        // Printer job?
        await this.octoprint.getPrinterJob()
        .then(job => {
          this.setCapabilityValue('job_completion', job.completion).catch(error => this.log(error));
          this.setCapabilityValue('job_estimate', job.estimate).catch(error => this.log(error));
          this.setCapabilityValue('job_time', job.time).catch(error => this.log(error));
          this.setCapabilityValue('job_left', job.left).catch(error => this.log(error));
        });
      }

      let pollInterval = Homey.ManagerSettings.get('pollInterval') >= 10 ? Homey.ManagerSettings.get('pollInterval') : 30;
      await delay(pollInterval*1000);
    }

	}
}

module.exports = OctoprintDevice;
