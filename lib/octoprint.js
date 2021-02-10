'use strict';

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
        return ( undefined !== response.version ) ? response.version : response;
    }


    async getPrinterState() {
        let result = false;
        const response = await this.getData('/api/connection');
        if ( response.current.state ) {
            result = ( 'Closed' == response.current.state ) ? 'Offline' : response.current.state;
        }
        return result;
    }


    async isPrinting() {
        let result = false;
        const response = await this.getData('/api/connection')
        if ( 'Printing' == response.current.state ) {
            result = true;
        }
        return result;
    }


    async getPrinterJob() {
        let result = {};
        const response = await this.getData('/api/job')
        if ( response.progress ) {
            result = {
                completion: Math.round(response.progress.completion),
                estimate: this.secondsToHms(Math.round(response.job.estimatedPrintTime)),
                time: this.secondsToHms(response.progress.printTime),
                left: this.secondsToHms(response.progress.printTimeLeft)
            };
        }
        return result;
    }


    async getPrinterTemps() {
        const response = await this.getData('/api/printer');
        return {
            bed: { actual: (undefined !== response.temperature.bed.actual) ? response.temperature.bed.actual : null },
            tool0: { actual: (undefined !== response.temperature.tool0.actual) ? response.temperature.bed.actual : null }
        };
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
            headers: { 'Authorization': 'Bearer '+this.apikey }
        }
        return new Promise(function (resolve, reject) {
            fetch(endpoint, options)
            .then(res => {
                if (res.ok) { return res.json(); }
                return false;
            })
            .then(json => {
                return resolve(json);
            })
            .catch(error => {
                return reject(error);
            });
        });
    }


    async getSnapshot() {
        return fetch(this.address+'/webcam/?action=snapshot');
    }


    secondsToHms(d) {
        if ( d ) {
            d = Number(d);
            let h = Math.floor(d / 3600);
            let m = Math.floor(d % 3600 / 60);

            let hDisplay = h > 0 ? h + "h " : "";
            let mDisplay = m > 0 ? m + "m " : "";
            return hDisplay + mDisplay; 
        } else {
            return 'None';
        }
    }
}

module.exports = { OctoprintAPI };