'use strict';

/**
 * Load Module Dependencies.
 */

const carbone = require ('carbone');
const util       = require ('util');


class DOC_GENERATOR {
    constructor(){

    }

    async generateDoc(data, template){

        let func =  util.promisify(this._generateDoc);
      
          let result;
          try {
            result = await func(data, template);      
            return result;
          } catch (ex) {
            throw(ex);
          } 
        
        
    }
    
    async generatePdf(data, template){

        let func =  util.promisify(this._generatePdf);
      
          let result;
          try {
            result = await func(data, template);      
            return result;
          } catch (ex) {
            throw(ex);
          } 
        
        
      }
      
    _generateDoc(data,template, cb){
        carbone.render(template, data, function (err, result){
          if (err) {        
              cb(err);
          }  
         cb(null, result);
         
      
          })
      }

      _generatePdf(data,template, cb){
        let options = {
          convertTo : 'pdf' //can be docx, txt, ...
          
        };
        carbone.render(template, data, options, function (err, result){
          if (err) {        
              cb(err);
          }  
         cb(null, result);
         
      
          })
      }



}

module.exports = DOC_GENERATOR;


 