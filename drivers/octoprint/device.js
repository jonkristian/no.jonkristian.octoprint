'use strict';

const Homey = require('homey');
const { OctoprintAPI } = require('../../lib/octoprint.js');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class OctoprintDevice extends Homey.Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.setAvailable();
    this.polling = false;
    this.addListener('poll', this.pollDevice);

    this.octoprint = new OctoprintAPI({
      ip: this.getSetting('ip'),
      apikey: this.getSetting('apikey')
    });

    this.printer = await this.octoprint.getPrinterConnected();

    if ( true == this.printer && false == this.getCapabilityValue('onoff') ) {
      this.setCapabilityValue('onoff', true).catch(error => this.log(error));
    }

    this.registerCapabilityListener('onoff', async (value,opts) => {
      // Don't trigger onoff while printing.
      if ( false == this.octoprint.getPrinterJob() ) {
        if (value == false) {
          console.log('Connecting printer.');
          await this.octoprint.postData('connect').catch(error => this.log(error));
        } else {
          console.log('Disconnecting printer.');
          await this.octoprint.postData('disconnect').catch(error => this.log(error));
        }
      }
    });

    this.octoprint.serverIsUp()
    .then(result => {
      console.log('Server is up, so we can poll.');
      this.polling = true;
      this.emit('poll');
		})
		.catch(error => {
      this.log('Cant reach the server.');
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
		while ( this.polling && this.printer ) {
			await this.octoprint.getData('/api/printer')
			.then(result => {
        // State
        this.setCapabilityValue('printer_state', result.state.text).catch(error => this.log(error));

        // Temps
        if ( undefined !== result.temperature ) {
          this.setCapabilityValue('printer_temp_bed', result.temperature.bed.actual).catch(error => this.log(error));
          this.setCapabilityValue('printer_temp_tool', result.temperature.tool0.actual).catch(error => this.log(error));
        }

        // Printing?
        this.octoprint.getPrinterJob()
        .then(job => {
          this.setCapabilityValue('job_completion', job.completion).catch(error => this.log(error));
          this.setCapabilityValue('job_estimate', job.estimate).catch(error => this.log(error));
          this.setCapabilityValue('job_time', job.time).catch(error => this.log(error));
          this.setCapabilityValue('job_left', job.left).catch(error => this.log(error));
        })
        .catch(error => {
          this.log('Cant get printer job.', error);
        });
			})
			.catch(error => {
        this.log('Cant poll, printer isnt connected?', error);
      });

      let pollInterval = Homey.ManagerSettings.get('pollInterval') || 30;
      await delay(pollInterval*1000);
		}
	}


	// async pingDevice() {
	// 	while (!this.polling && this.pinging) {
	// 		this.setUnavailable();
	// 		await this.octoprint.serverIsUp()
	// 		.then(result => {
  //         this.log('Set available after ping.');
	// 				this.setAvailable();
	// 				this.polling = true;
	// 				this.pinging = false;
	// 				this.emit('poll');
	// 				return;
	// 		})
	// 		.catch(error => {
	// 			this.log('Not reachable, pinging every 60 seconds to see if it comes online again.', error);
  //     });

	// 		await delay(60000);
	// 	}
	// }

}

module.exports = OctoprintDevice;
