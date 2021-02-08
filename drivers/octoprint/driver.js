'use strict';

const Homey = require('homey');

class OctoprintDriver extends Homey.Driver {
  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Printer has been initialized');

    this._printStartedTrigger = new Homey.FlowCardTriggerDevice('printStarted').register();
    this._printFinishedTrigger = new Homey.FlowCardTriggerDevice('printFinished').register();
  }

  triggerPrintStarted( device, tokens ) {
    this._printStartedTrigger.trigger(device, tokens).catch(this.error)
  }

  triggerPrintFinished( device, tokens ) {
    this._printFinishedTrigger.trigger(device, tokens).catch(this.error);
  }

  onPair( socket ) {
    socket.on('showView', (viewId, callback) => {
      callback();
      
      if( viewId === 'octoprint_auth' ) {
        socket.emit('ip', 'apikey', function( err, data ){
	        console.log( data )
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