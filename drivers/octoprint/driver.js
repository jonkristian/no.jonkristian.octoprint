'use strict';

const Homey = require('homey');
const { OctoprintAPI } = require('../../lib/octoprint.js');

class OctoprintDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Printer has been initialized');

    this._printStartedTrigger = this.homey.flow.getDeviceTriggerCard('printStarted');
    this._printFinishedTrigger = this.homey.flow.getDeviceTriggerCard('printFinished');
  }

  triggerPrintStarted( device, tokens, state ) {
    this._printStartedTrigger.trigger(device, tokens, state).catch(this.error);
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
          const version = await octoprint.getServerState();

          return version;
        });
      }

    });
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    // const address = '192.168.1.76';
    // const printer = this.octoprint.getData('/api/version', address);
    console.log("Listing devices");

    // const discoveryStrategy = this.getDiscoveryStrategy();
    // const discoveryResults = discoveryStrategy.getDiscoveryResults();

    // console.log(Object.values(discoveryResults));

    // const devices = Object.values(discoveryResults).map(discoveryResult => {
    //   return {
    //     name: discoveryResult.txt.name,
    //     data: {
    //       id: discoveryResult.id,
    //     }
    //   };
    // });

    // console.log('Found devices', devices);
    // callback(null, devices);
  }
}

module.exports = OctoprintDriver;