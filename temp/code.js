const mammoth    = require ('mammoth-style');
const docxConverter = require('docx-pdf');

exports.fetchDocx2  = function* fetchDocx2(next){
    let data = [
      {
        movieName: "Mizan",
        actors:[{
          firstname: "WubEngida",
          lastname: "Abate"
        },
        {
          firstname: "Abel",
          lastname: "Mulugeta"
        }]
      },
      {
        movieName: "Mogachoch",
        actors:[{
          firstname: "Selam",
          lastname: "Asmare"
        },
        {
          firstname: "Bute",
          lastname: "Kassaye"
        }]
      }
    ]
  
    let template = "./node_modules/carbone/examples/movies.docx"
    let report = yield testNow(data,template);
    let buf = Buffer.from(report);
    
    this.body = buf;
  
  }
  
  
  
  
  
  
  exports.testJsReport2 = function* testJsReport2(next){
    //Test jsreport sample report.
  
    try{
    this.body = {res: "I am here"};
    
    jsreportService = new REPORT ({headers: this.request.header});
  
    let report = yield jsreportService.generateSampleReport({});
  
    // fs.writeFileSync("../test.pdf",report)
  
    // this.body = {
    //   "path":"../test.pdf"
    // }
  
    this.body = report;
  
    }catch(ex) {
      return this.throw(new CustomError({
        type: ex.type ? ex.type : 'VIEW_REPORT_ERROR',
        message: JSON.stringify(ex.stack),
      }));
    }
  
  }

  exports.testJsReport = function* testJsReport(next){
    let data = [
      {
        movieName: "Mizan",
        actors:[{
          firstname: "WubEngida",
          lastname: "Abate"
        },
        {
          firstname: "Abel",
          lastname: "Mulugeta"
        }]
      },
      {
        movieName: "Mogachoch",
        actors:[{
          firstname: "Selam",
          lastname: "Asmare"
        },
        {
          firstname: "Bute",
          lastname: "Kassaye"
        }]
      }
    ]
  
    let data2= [
      {
          client: "Debela Ibssa Gutema",
          loan_cycles: [{
            crops: [
                "Tomato"
            ],
            loan_cycle_no: 1,
            estimated_total_cost: 25000,
            estimated_total_revenue: 40000,
            actual_total_cost: 30000,
            actual_total_revenue: 420000,
            loan_requested: 20000,
            loan_approved: 15000
        }]
      },
      
      {
          client: "Hg Gh G",
          loan_cycles: [
              {
                  crops: [
                      "Tomato"
                  ],
                  loan_cycle_no: 1,
                  estimated_total_cost: 0,
                  estimated_total_revenue: 0,
                  actual_total_cost: 0,
                  actual_total_revenue: 0,
                  loan_requested: 0,
                  loan_approved: 18000
              },
              {
                  crops: [
                      "Tomato"
                  ],
                  loan_cycle_no: 2,
                  estimated_total_cost: 0,
                  estimated_total_revenue: 0,
                  actual_total_cost: 0,
                  actual_total_revenue: 0,
                  loan_requested: 0,
                  loan_approved: 25500
              }
          ]
      }
      
  ]
  
    let pdfConverter = new PDF_CONVERTER();
  
  
    let template = "./templates/CLIENT LOAN HISTORY REPORT TEMPLATE.docx"
    let report = yield testNow(data2, template);
  
    //let pdf = yield convertHelper(report,"exportPDF");
  
    //let pdf = yield pdfConverter.convertHelper(report,"exportPDF");
    
    let buf = Buffer.from(report);
  
    fs.writeFileSync("./temp/report.docx", report);
    let pdf = yield libreConverter("./temp/report.docx");
    buf = Buffer.from(pdf);
    fs.unlinkSync("./temp/report.docx");
  
    
   
    //this.body = report;
    //this.body = {report: report.toString('base64')};
    //console.log(pdf)
    //let buf2 = Buffer.from(html);
    this.body = buf;
     
    
  } 


  //simple pdf converting
  function _convertToPdf(input, output, cb){
    docxConverter(input,output,function(err,result){
      if(err){
        cb(err);
      }
      cb(null, result);
    });
  
  }
  
  async function convertoPdf(input, output){
  
    let func =  util.promisify(_convertToPdf);
  
      let result;
      try {
        result = await func(input, output);      
        return result;
      } catch (err) {
        return err;
      } 
    
    
  }

  exports.testPlatform = function* testPlatform(next){
    let platform = process.platform;
  
    let indir = "./temp/test.docx"
    let outdirc = "./temp/test.pdf"
  
    // let command = "\"C:/Program Files/LibreOffice/program/soffice.exe\" --headless --convert-to pdf --outdir " +
    //       outdirc +" " + indir
    
    //let command = "/lib/libreoffice/program/soffice --headless --convert-to pdf --outdir " +
            // outdirc +" " + indir
    let command = "docker run --rm -v $(pwd)/mybashscript.sh:/mybashscript.sh ubuntu bash /mybashscript.sh"
    
    let x = yield execCommand(command)
  
  
    this.body = {
      "platform": platform,
      "x": x
    };
  }
  
  
  
  async function execCommand (command){
    let func = util.promisify(function execcmd(command, cb){
      exec (command, function (err, res){
        if (err) {return cb(err)}
  
        return cb(null, res)
      })
      
    })
  
    return await func(command)
  
  }