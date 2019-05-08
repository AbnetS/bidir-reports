'use strict';
/**
 * Load Module Dependencies.
 */
const fs         = require('fs-extra');
const util       = require ('util');
const libreConvert  = require ('libreoffice-convert')

class LIBRE_CONVERTER {
    constructor(){

    }

    async convertToPdf(input){
          
        let func =  util.promisify(this._convertToPdf);
      
        let result;
        try {
        result = await func(input);      
        return Buffer.from(result);
                    
        } catch (ex) {
            throw(ex);
        }         
        
    }

    _convertToPdf(input, cb){
        // Read file
        const docx = fs.readFileSync(input);
        // Convert it to pdf format with undefined filter (see Libreoffice doc about filter)
        libreConvert.convert(docx, 'pdf', undefined, (err, done) => {
          if (err) {
           cb(err);
          }
          
          // Here in done you have pdf file which you can save or transfer in another stream
          cb(null, done);
      });
      }


}

module.exports = LIBRE_CONVERTER;


  
  