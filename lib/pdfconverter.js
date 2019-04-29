const fs = require('fs');
//const docx = require("@nativedocuments/docx-wasm");
 
// init docx engine
// docx.init({
//     ND_DEV_ID: "39JK0J92MMNMTD2IHI6QA5H5M1",
// ND_DEV_SECRET: "41K5E3NC244HG9QNQPDI4QIO62",
//     ENVIRONMENT: "NODE", // required
//     LAZY_INIT: true      // if set to false the WASM engine will be initialized right now, usefull pre-caching (like e.g. for AWS lambda)
// }).catch( function(e) {
//     console.error(e);
// });
 
// async function convertHelper(document, exportFct) {
//     const api = await docx.engine();
//     await api.load(document);
//     const arrayBuffer = await api[exportFct]();
//     await api.close();
//     return arrayBuffer;
// }