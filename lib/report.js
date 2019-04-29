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
const carbone  = require ('carbone');
const util      = require ('util');



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

    async _test(data,cb){

        return util.promisify(
            carbone.render('./node_modules/carbone/examples/movies.docx', data, function (err, result){
            if (err) {
                //return console.log(err);
                return err; 
                //cb(err);
            }
            //fs.writeFileSync('C:/Users/user/Documents/TestReports/result.docx', result);
            let buf = Buffer.from (result);
            console.log(buf);
            return buf;
            //cb(null, buf);
            
        
        
            })
        );
    }

    async testCarbone(data){
        let res = await this._test(data,null);
        // await this._test (data, function(err, result){
        //     if (err) {
        //         return err;
        //     }
        //     console.log(result);
        //     return result;
        // })
        console.log ("xx");

        console.log(res);

        console.log("yy");

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