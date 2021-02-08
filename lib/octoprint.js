'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class OctoprintAPI {

    constructor(options) {
        if (null == options) {
            options = {}
        }
        this.port = ( options.port ) ? ':'+options.port : '';
        this.address = ( 'on' == options.ssl ) ? 'https://'+options.address : 'http://'+options.address+this.port;
        this.apikey = options.apikey;
    }


    async getServerState() {
        const response = await this.getData('/api/server');
        if ( response.version ) {
            return response.version;
        } else {
            throw new Error('Cant reach the server');
        }
    }


    async getPrinterState() {
        const response = await this.getData('/api/connection');
        if ( response.current.state ) {
            let result = ( 'Closed' == response.current.state ) ? 'Offline' : response.current.state;
            return result;
        } else {
            throw new Error('Cant reach the printer');
        }
    }


    async isPrinting() {
        const response = await this.getData('/api/connection')
        if ( 'Printing' == response.current.state ) {
            return true;
        } else {
            return false;
        }
    }


    async getPrinterJob() {
        let result = {};
        await this.getData('/api/job')
        .then(response => {
            if ( response.progress ) {
                result = {
                    completion: Math.round(response.progress.completion),
                    estimate: this.secondsToHms(Math.round(response.job.estimatedPrintTime)),
                    time: this.secondsToHms(response.progress.printTime),
                    left: this.secondsToHms(response.progress.printTimeLeft)
                };
            }
        })
        .catch(error => {
            console.log('Couldnt get printer job', error);
        });

        return result;
    }

    async getPrinterTemps() {
       let result = {};
        await this.getData('/api/printer')
        .then(response => {
            if ( response.temperature ) {
                result = {
                    bed: { actual: response.temperature.bed.actual },
                    tool0: { actual: response.temperature.tool0.actual }
                };
            }
        })
        .catch(error => {
            console.log('Couldnt get printer temperatures', error);
        });

        return result;
    }


    async postData(path, data) {
        const endpoint = this.address+path;
        const options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer '+this.apikey
            }
        }

        fetch(endpoint, options)
        .then(res => res.json())
        .then(json => {
            return json;
        })
        .catch(err => {
            return err;
        });
    }


    async getData(path) {
        const endpoint = this.address+path;
        const options = {
            headers: {
                'Authorization': 'Bearer '+this.apikey
            }
        }
        return new Promise(function (resolve, reject) {
            fetch(endpoint, options)
            .then(res => res.json())
            .then(json => {
                return resolve(json);
            })
            .catch(error => {
                return reject(error);
            });
        });
    }


    secondsToHms(d) {
        d = Number(d);
        let h = Math.floor(d / 3600);
        let m = Math.floor(d % 3600 / 60);

        let hDisplay = h > 0 ? h + "h " : "";
        let mDisplay = m > 0 ? m + "m " : "";
        return hDisplay + mDisplay; 
    }
}

module.exports = { OctoprintAPI };