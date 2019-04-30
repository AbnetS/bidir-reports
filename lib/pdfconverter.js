const fs = require('fs');
const docx = require("@nativedocuments/docx-wasm");

const config    = require ('../config/index');

//init docx engine
docx.init({
    ND_DEV_ID: config.DOCX_WASM_API_KEY.ND_DEV_ID,
    ND_DEV_SECRET: config.DOCX_WASM_API_KEY.ND_DEV_SECRET,
    ENVIRONMENT: "NODE", // required
    LAZY_INIT: true      // if set to false the WASM engine will be initialized right now, usefull pre-caching (like e.g. for AWS lambda)
}).catch( function(e) {
    console.error(e);
});

class PDF_CONVERTER {
    constructor (){       

    }
 

 
    async convertHelper(document, exportFct) {
        const api = await docx.engine();
        await api.load(document);
        const arrayBuffer = await api[exportFct]();
        await api.close();
        return arrayBuffer;
    }
}

module.exports = PDF_CONVERTER;