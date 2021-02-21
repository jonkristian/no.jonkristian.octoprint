'use strict';

const Homey = require('homey');
const { OctoprintAPI } = require('../../lib/octoprint.js');

class OctoprintDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Printer has been initialized');

    this._printStartedTrigger = this.homey.flow.getDeviceTriggerCard('print_started');
    this._printPausedTrigger = this.homey.flow.getDeviceTriggerCard('print_paused');
    this._printFinishedTrigger = this.homey.flow.getDeviceTriggerCard('print_finished');
  }

  triggerPrintStarted( device, tokens, state ) {
    this._printStartedTrigger.trigger(device, tokens, state).catch(this.error);
  }

  triggerPrintPaused( device, tokens, state ) {
    this._printPausedTrigger.trigger(device, tokens, state).catch(this.error);
  }

  triggerPrintFinished( device, tokens, state ) {
    this._printFinishedTrigger.trigger(device, tokens, state).catch(this.error);
  }

  async onPair( session ) {
    session.setHandler('showView', async (viewId) => {

      if ('start' === viewId) {
        session.setHandler('addOctoprint', async function(connection) {
          // Test connection, see if we can retrieve octoprint version.
          const octoprint = new OctoprintAPI(connection);
          return await octoprint.getServerState().catch(error => console.log(error));
        });
      }

    });
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    //
  }
}

module.exports = OctoprintDriver;