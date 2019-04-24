'use strict';
/**
 * Load Module Dependencies
 */
let fs    = require('fs');
const url = require('url');

const request = require('request-promise');
const debug = require('debug')('api:cbs');
const pify  = require('pify');
const fse = require('fs-extra');
const $request = require('request');
const moment = require('moment');
const path     = require ('path');



fs = pify(fs);

const config = require('../config');

class REPORT {
    constructor (config){
        this.headers = config.headers

    }

    async generateSampleReport (body){
        
        let bodyData = {
            "template":{"shortid":"l1DbOPsN5"},
            "data":{
            "number": "123",
            "seller": {
                "name": "Next Step Webs, Inc.",
                "road": "12345 Sunny Road",
                "country": "Sunnyville, TX 12345"
            },
            "buyer": {
                "name": "Acme Corp.",
                "road": "16 Johnson Road",
                "country": "Paris, France 8060"
            },
            "items": [{
                "name": "Website design",
                "price": 500
            }]
        },
        "options": {  "Content-Disposition": "attachment; filename=myreport.pdf" }
            
        };

        

        let res = await this._makeRequest(bodyData, "https://playground.jsreport.net/w/admin/hBfqC7af/api/report/initialize", 
                    this.headers, 'POST') 
        
        return res;
    
    
    }

    
    async _makeRequest(data, endpoint, headers = {}, method = 'POST') {
        var header = {            
            accept: "application/pdf",
            authorization: headers.authorization
        }
        
        let opts = {
          method: method,
          url: endpoint,
          json: true,
          body: data,
          headers: header,
          encoding: null
        
        }

        debug (opts);
        console.log(opts);
    
        let res = await request(opts);   
          
    
        return res;
      }

      


}

module.exports = REPORT;