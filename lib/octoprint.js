'use strict';

const fetch = require('node-fetch');

class OctoprintAPI {

    constructor(options) {
        if (null == options) {
            options = {}
        }

        this.address = options.address;
        if (!/^(?:f|ht)tps?\:\/\//.test(options.address)) {
            this.address = "http://" + options.address;
        }

        this.apikey = options.apikey;
    }


    async getServerState() {
        let result = false;
        await this.getData('/api/server')
        .then(res => {
            if ( res.version ) { result = res.version; }
        })
        .catch(error => {
            return error;
        });
        return result;
    }


    async getPrinterState() {
        let result = false;
        await this.getData('/api/connection')
        .then(res => {
            if (res.current.state) { result = res.current.state; }
        })
        .catch(error => {
            return error;
        });
        return result;
    }


    async isPrinting() {
        let result = false;
        await this.getData('/api/connection')
        .then(res => {
            if ( 'Printing' == res.current.state ) { result = true; }
        })
        .catch(error => {
            return error;
        });
        return result;
    }


    async getPrinterJob() {
        let result = {};
        await this.getData('/api/job')
        .then(res => {
            if ( res.progress ) {
                result = {
                    completion: Math.round(res.progress.completion),
                    estimate: this.secondsToHms(Math.round(res.job.estimatedPrintTime)),
                    time: this.secondsToHms(res.progress.printTime),
                    left: this.secondsToHms(res.progress.printTimeLeft)
                };
            }
        })
        .catch(error => {
            return error;
        });
        return result;
    }


    async getPrinterTemps() {
        let result = {};
        await this.getData('/api/printer')
        .then(res => {
            result = {
                bed: { actual: (undefined !== (((res||{}).temperature||{}).bed||{}).actual) ? res.temperature.bed.actual : null },
                tool0: { actual: (undefined !== (((res||{}).temperature||{}).tool0||{}).actual) ? res.temperature.tool0.actual : null }
            };
        })
        .catch(error => {
            return error;
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
        .catch(error => {
            return error;
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
                if (res.status === 200) { return res.json(); }
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


    async getSnapshot(endpoint) {
        let address = this.address+'/webcam/?action=snapshot';
        if ( '' !== endpoint ) {
            if (!/^(?:f|ht)tps?\:\/\//.test(endpoint)) {
                address = "http://" + endpoint;
            }
        }
        return await fetch(address);
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
            return '-';
        }
    }
}

module.exports = { OctoprintAPI };