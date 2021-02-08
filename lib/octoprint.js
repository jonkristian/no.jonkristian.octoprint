'use strict';

const Homey = require('homey');
const fetch = require('node-fetch');

class OctoprintAPI {

    constructor(options) {
        if (null == options) {
            options = {}
        }

        console.log(options.ssl);
        console.log(options.port);

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
            return response.current.state;
        } else {
            throw new Error('Cant reach the printer');
        }
    }


    async getPrinterJob() {
        let result = {
            completion: null,
            estimate: null,
            time: null,
            left: null
        };

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
        // let s = Math.floor(d % 3600 % 60);

        let hDisplay = h > 0 ? h + "h " : "";
        let mDisplay = m > 0 ? m + "m " : "";
        // let sDisplay = s > 0 ? s + "s" : "";
        // return hDisplay + mDisplay + sDisplay; 
        return hDisplay + mDisplay; 
    }
}

module.exports = { OctoprintAPI };