'use strict';

const Homey = require('homey');

class OctoPrint extends Homey.App {
  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Octoprint has been initialized.');

    // API - Key
    // 7BFA9E9EA22B45E5B38932FDAB25105A
  }
}

module.exports = OctoPrint;