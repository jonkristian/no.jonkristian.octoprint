'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class OctoprintAPI {

    constructor(options) {
        if (null == options) {
            options = {}
        }

        this.port = ( undefined == options.port ) ? ':80' : ':'+options.port;
        this.address = ( true == options.ssl ) ? 'https://'+options.address : 'http://'+options.address+this.port;
        this.apikey = options.apikey;
    }

    async getServerState() {
        const response = await this.getData('/api/server');
        if ( response.version ) {
            return response.version;
        } else {
            throw new Error('Cant reach the server.');
        }
    }

    async getPrinterState() {
        const response = await this.getData('/api/connection');
        if ( response.current.state ) {
            return response.current.state;
        } else {
            throw new Error('Cant reach the printer.');
        }
    }

    async getPrinterJob() {
        let result = {
            completion: '-',
            estimate: '-',
            time: '-',
            left: '-'
        };

        await this.getData('/api/job')
        .then(response => {
            result = {
                completion: Math.round(response.progress.completion),
                estimate: this.secondsToHms(Math.floor(response.estimatedPrintTime / 0.1)),
                time: this.secondsToHms(response.progress.printTime),
                left: this.secondsToHms(response.progress.printTimeLeft)
            };
        })
        .catch(error => {
            console.log(error);
        });

        return result;
    }

    async postData(path, data) {
        const endpoint = this.address+path;
        const options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Authorization': 'Bearer '+this.apikey
            }
        }
        fetch(endpoint, options)
        .then(res => res.json())
        .then(json => {
            console.log(json);
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
        var h = Math.floor(d / 3600);
        var m = Math.floor(d % 3600 / 60);
        // var s = Math.floor(d % 3600 % 60);

        var hDisplay = h > 0 ? h + "h " : "";
        var mDisplay = m > 0 ? m + "m " : "";
        // var sDisplay = s > 0 ? s + "s" : "";
        // return hDisplay + mDisplay + sDisplay; 
        return hDisplay + mDisplay; 
    }
}

module.exports = { OctoprintAPI };