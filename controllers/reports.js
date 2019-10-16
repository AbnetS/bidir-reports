'use strict';
/**
 * Load Module Dependencies.
 */


const debug      = require('debug')('api:client-controller');
const moment     = require('moment');
const fs         = require('fs-extra');
const async      = require ('async');
const util       = require ('util');
const libreConvert  = require ('../lib/libreConverter')


//const pdfjs = require('pdfjs-dist');

//const fs = require('fs');
const docx = require("@nativedocuments/docx-wasm");


const CustomError        = require('../lib/custom-error');
const checkPermissions   = require('../lib/permissions');
const PDF_CONVERTER      = require ('../lib/pdfconverter');//CLASS
const DOC_GENERATOR      = require ('../lib/doc-generator');//CLASS
const LIBRE_CONVERTER     = require ('../lib/libre-converter'); //CLASS

const Account            = require('../models/account');
const Branch             = require('../models/branch');
const History            = require('../models/history');
const Crop               = require('../models/crop');
const ACAT               = require('../models/ACAT');
const ClientACAT         = require('../models/clientACAT');
const Client             = require('../models/client');
const LoanProposal       = require('../models/loanProposal');
const Screening          = require('../models/screening');

const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const HistoryDal         = require('../dal/history');
const ACATDal            = require('../dal/ACAT');
const ReportDal          = require('../dal/report');
const ReportTypeDal      = require('../dal/reportType');

const config             = require('../config/index');

let hasPermission = checkPermissions.isPermitted('REPORT');

let jsreportService = null;



/**
 * Get a report type.
 *
 * @desc Fetch a report type with the given id f
 *
 * @param {Function} next Middleware dispatcher
 */
exports.create = function* createReportType(next) {
  debug('create report type');

  let body = this.request.body;

  this.checkBody('title')
      .notEmpty('Report title is Empty');
  this.checkBody('type')
      .notEmpty('Report Type is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'REPORT_TYPE_CREATION_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  try {

    let reportType = yield ReportTypeDal.get(body);
    if (reportType) {
      throw new Error('Report Type Exists Already')
    }

    reportType = yield ReportTypeDal.create(body);

    this.body = reportType;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'REPORT_TYPE_CREATION_ERROR',
      message: ex.message
    }));
  }
}

exports.update = function* updateReportTypes(next) {
  debug(`update report type: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  let body = this.request.body;

  try {

    let reportType = yield ReportTypeDal.update(query, body);

    this.body = reportType;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'UPDATE_REPORT_TYPES_ERROR',
      message: ex.message
    }));
  }
}

/**
 * Get a report type.
 *
 * @desc Fetch a report type with the given id f
 *
 * @param {Function} next Middleware dispatcher
 */
exports.getCollection = function* getReportTypes(next) {
  debug('get report types');

  try {

    let reportTypes = yield ReportTypeDal.getCollection({});

    this.body = reportTypes;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_REPORT_TYPES_ERROR',
      message: ex.message
    }));
  }
}

/**
 * Get a report type.
 *
 * @desc Fetch a report type with the given id f
 *
 * @param {Function} next Middleware dispatcher
 */
exports.fetchOne = function* fetchOneReportType(next) {
  debug(`fetch report type: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    if(this.query.format) {
      throw new Error(`${this.query.format} not yet implemented!`)
    }

    let reportType = yield ReportTypeDal.get(query);
    if (!reportType) {
      throw new Error('Report Type Does Not Exist!')
    }

    yield LogDal.track({
      event: 'view_report',
      screening: this.state._user._id ,
      message: `View report - ${reportType.title}`
    });

    const REPORTS = {
      CLIENTS_BY_GENDER: viewByGender,
      CLIENTS_BY_BRANCH: viewByBranch,
      CROP_STATS: viewCropsStats,
      LOAN_CYCLE_STAGES_STATS: viewStagesStats,
      CLIENTS_BY_CROPS: viewByCrops,
      LOAN_CYCLE_STAGES: viewByStage,
      CLIENT_LOAN_CYCLE_STATS: viewClientLoancycleStats
    };

    let type = Object.keys(REPORTS).filter(function(item){
      return reportType.type === item
    });

    if (!type.length) {
      throw new Error('Report Generator Not Implemented!');
    }

    let report = yield REPORTS[type[0]](this, reportType);

    this.body = report;

  } catch(ex) {
    return this.throw(new CustomError({
      type: ex.type ? ex.type : 'VIEW_REPORT_ERROR',
      message: JSON.stringify(ex.stack),
    }));
  }

}

exports.fetchPdf  = function* fetchPdf(next){
  debug(`fetch report type: ${this.params.id}`);

  let query = {
    _id: this.params.id
  };

  try {
    if(this.query.format) {
      throw new Error(`${this.query.format} not yet implemented!`)
    }

    let reportType = yield ReportTypeDal.get(query);
    if (!reportType) {
      throw new Error('Report Type Does Not Exist!')
    }

    yield LogDal.track({
      event: 'view_report',
      screening: this.state._user._id ,
      message: `View report - ${reportType.title}`
    });

    const REPORTS = {
      ACTIVE_CLIENTS_LIST: returnFilteredClientsList,
      // CLIENTS_BY_GENDER: viewByGender,
      // CLIENTS_BY_BRANCH: viewByBranch,
      CROP_STATS: viewCropsStats,
      LOAN_CYCLE_STAGES_STATS: viewStagesStats,
      CLIENTS_BY_CROPS: viewByCrops, //will use the summary part
      // LOAN_CYCLE_STAGES: viewByStage,
      CLIENT_LOAN_CYCLE_STATS: viewClientLoancycleStats,
      CLIENT_LOAN_CYCLE_STATS_SUMMARY: viewClientLoancycleStats
    };

    let type = Object.keys(REPORTS).filter(function(item){
      return reportType.type === item
    });

    if (!type.length) {
      throw new Error('Report Generator Not Implemented!');
    }

    let result = yield REPORTS[type[0]](this, reportType);
    let data = [];
    if (result.length) data = result
    else if (result.data){
        data = result.data
    }
    else{
      data.push(result)
    } 
    

  let template = "./templates/" + type + ".docx" 
  let docGenerator = new DOC_GENERATOR(); 
  let report = yield docGenerator.generatePdf(data, template);
  
  let buf = Buffer.from(report);
  
  //***********convert to pdf using the LibreOffice converter library**************/  
  // let libreConverter = new LIBRE_CONVERTER();
  // fs.writeFileSync("./temp/report.docx", report);
  // let pdf = yield libreConverter.convertToPdf("./temp/report.docx");
  // //buf = Buffer.from(pdf);
  // fs.unlinkSync("./temp/report.docx");

  //***********convert to pdf using the docx-wasm pdf converter which has higher quality but needs Internet connection**************/
  // let pdfConverter = new PDF_CONVERTER();
  // let pdf = yield pdfConverter.convertHelper(report,"exportPDF");
  // let buf = Buffer.from(pdf);
  

  //this.body = pdf;
  this.body = buf;

} catch(ex) {
  return this.throw(new CustomError({
    type: ex.type ? ex.type : 'VIEW_REPORT_ERROR',
    message: JSON.stringify(ex.stack),
  }));
}
  

}

exports.fetchDocx  = function* fetchDocx(next){
  debug(`generate report : ${this.params.id}`);  

  let query = {
    _id: this.params.id
  };

  try {
    if(this.query.format) {
      throw new Error(`${this.query.format} not yet implemented!`)
    }

    let reportType = yield ReportTypeDal.get(query);
    if (!reportType) {
      throw new Error('Report Type Does Not Exist!')
    }

    yield LogDal.track({
      event: 'view_report',
      screening: this.state._user._id ,
      message: `View report - ${reportType.title}`
    });

    const REPORTS = {
      ACTIVE_CLIENTS_LIST: returnFilteredClientsList,
      // CLIENTS_BY_GENDER: viewByGender,
      // CLIENTS_BY_BRANCH: viewByBranch,
      CROP_STATS: viewCropsStats,
      LOAN_CYCLE_STAGES_STATS: viewStagesStats,
      CLIENTS_BY_CROPS: viewByCrops,//will use the summary part
      // LOAN_CYCLE_STAGES: viewByStage,
      CLIENT_LOAN_CYCLE_STATS: viewClientLoancycleStats,
      CLIENT_LOAN_CYCLE_STATS_SUMMARY: viewClientLoancycleStats
    };

    let type = Object.keys(REPORTS).filter(function(item){
      return reportType.type === item
    });

    if (!type.length) {
      throw new Error('Report Generator Not Implemented!');
    }

    let result = yield REPORTS[type[0]](this, reportType);
    let data = [];
    if (result.length) data = result;
    else if (result.data){
        data = result.data
    }
    else{
      data.push(result)
    }   

  let template = "./templates/" + type + ".docx";
  let docGenerator = new DOC_GENERATOR(); 
  let report = yield docGenerator.generateDoc(data, template);

  
  let buf = Buffer.from(report); 
  this.body = buf;


} catch(ex) {
  return this.throw(new CustomError({
    type: ex.type ? ex.type : 'VIEW_REPORT_ERROR',
    message: JSON.stringify(ex.stack),
  }));
}

}



// Reports Generators

/**
 * Get Clients List filtered by required parameters
 * @param {} ctx 
 * @param {*} reportType 
 */
async function returnFilteredClientsList(ctx, reportType){
  //Get All lists filtered by the required parameters and get intersection of those.
  let query = {};  

  let canViewAll =  await hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  await hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = await Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        //query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query.created_by = user._id;

    // DEFAULT
    } else {
      query.created_by = user._id;
    }

    let parameters = []; let sets = []; let list = []; 

    const filterFunction = { 
      gender: returnClientsListFilteredByGender,
      status: returnClientsListFilteredByStatus,
      branch: returnClientsListFilteredByBranch,
      loanStage: returnClientsListFilteredByStage,
      crop: returnClientsListFilteredByCrop,
      loanCycle: returnClientsListFilteredByCurrentLoanCycle,
      fromDate: returnClientsListFilteredByDateRange,
      toDate: returnClientsListFilteredByDateRange
    }

    let body = ctx.request.body;
    if (!((body.fromDate && body.toDate) || (!body.fromDate && !body.toDate))) //they have to exist in pair
      throw new Error("Incomplete date range is detected in the request");
    

    let range = false;
    for (let key in body){
      let param = reportType.parameters.find(item => item.code === key);
      //Add validation if param is not found
      if (!range && (param.code === "fromDate" || param.code === "toDate")){
        parameters.push({"label": "Date Range", "value":body.fromDate.display + " - " + body.toDate.display});
        list = await filterFunction[key](query, body.fromDate.send, body.toDate.send);
        sets.push (list);
        range = true;
      }
      else if (range && (param.code === "fromDate" || param.code === "toDate")) continue; 
      else {
        parameters.push({"label": param.name, "value":body[key].display});
        list = await filterFunction[key](query, body[key].send);
        sets.push (list);
      }
    }
      
    //Get intersection of the lists
    let interList = sets.reduce(intersect);    
    
    let result = {}; result.data = {};

    //Set date  for the report data
    let currentDate = moment().format('MMMM DD, YYYY');
    result.data.date = currentDate;

    //Set clients list and parameters list for the report data
    result.data.clients = []; result.data.parameters = [];
    result.data.parameters = parameters; /*let i = 1;*/

    //Complete additional attributes of the clients list
    for (let client of interList){
      /*client._doc.No = i;*/ client._doc.stage = "";
      for (let key in config.STAGE_STATUS){
        let status = config.STAGE_STATUS[key].statuses.find(item => item.code === client._doc.status);
        if (status){
          client._doc.stage = config.STAGE_STATUS[key].stage;
          client._doc.status = status.name;
          break;   
        }        
      }   
      let dateAndCropOfLastLoanCycle =  await getTheLastLoanCycleDateAndCrop(client._doc);
      client._doc.loanCycleStartedAt =  moment(dateAndCropOfLastLoanCycle.loanProcessStartedAt).format("MMM DD, YYYY");    
      client._doc.crops = dateAndCropOfLastLoanCycle.crops;
      result.data.clients.push(client._doc);
      //i++;
    }  
    
    //Sort clients by the loan cycle date in descending order
    result.data.clients = result.data.clients.sort (
                                  (client1,client2) => 
                                    {if (new Date(client1.loanCycleStartedAt) > new Date(client2.loanCycleStartedAt)) return 1;
                                     if (new Date(client1.loanCycleStartedAt) < new Date(client2.loanCycleStartedAt)) return -1})

    
    let i = 1;
    for (let client of result.data.clients){
      client.No = i;
      i++;
    }
    return result;

  } catch (ex){
    throw (ex);
  }


  async function returnClientsListFilteredByGender(query, gender){
    query.gender = gender;    
    let clients = await ClientDal.getCollection(query);
    delete query.gender;
    return clients;
  }

  async function returnClientsListFilteredByStatus(query, status){    
    query.status = {'$regex' : status, '$options' : 'i'};  
    let clients = await ClientDal.getCollection(query);
    delete query.status;
    return clients;
  }

  async function returnClientsListFilteredByBranch(query, branch){
    query.branch = branch;  
    let clients = await ClientDal.getCollection(query);
    delete query.branch;
    return clients;
  }

  async function returnClientsListFilteredByCurrentLoanCycle(query, cycleNo){
    query.loan_cycle_number = cycleNo;  
    let clients = await ClientDal.getCollection(query);
    delete query.loan_cycle_number;
    return clients;
  }

  async function returnClientsListFilteredByStage(query, stage){
    //let patterns = stage.replace(" ","_");
    //let statusList = await getStatuses (stage);
    let statusList = [];
    let statuses = config.STAGE_STATUS[stage].statuses;
    for (let status of statuses){
      statusList.push(status.code)
    }
    
    query.status = {'$in' : statusList}
    let clients = await ClientDal.getCollection(query);
    delete query.status;
    return clients;
  }

  /* Filter clients list by their last loan cycle crop */
  async function returnClientsListFilteredByCrop (query, crop){
    let latestHistoryColl = await History.aggregate([
      {$unwind: "$cycles"},      
      {$match:{
        $expr: {            
            $eq: [{$toInt: "$cycles.cycle_number"}, {$toInt: "$cycle_number"}]
          }
        }
      }
  
      ]).exec();
    
    let ids = [];
    for (let history of latestHistoryColl){
    if(history.cycles.acat){
      let currentACAT = await ClientACAT.findOne({_id:history.cycles.acat}).exec();
      if (currentACAT){        
        for (let acat of currentACAT.ACATs){
          let cropACAT = await ACAT.findOne({_id: acat}).populate("crop").exec();            
          if (String(cropACAT.crop._id) === crop)
            ids.push(cropACAT.client)            
        }
      }

    }
  }
  let clients = await ClientDal.getCollection({
    _id: { $in: ids.slice() }
  })

  return clients;
}

  /* Filter clients list by date range - date of screening of last loan cycle is considered as
     the date the latest loan processing is started. Registration date is not considered here as
     the loan process determines the activeness of the client */
  async function returnClientsListFilteredByDateRange (query, fromDate, toDate){
    let latestHistoryColl = await History.aggregate([
      {$unwind: "$cycles"},      
      {$match:{
        $expr: {            
            $eq: [{$toInt: "$cycles.cycle_number"}, {$toInt: "$cycle_number"}]
          }
        }
      }      
  
      ]).exec();
    
    let ids = [];
    for (let history of latestHistoryColl){
      if(history.cycles.screening){
        let screening = await Screening.findOne({_id:history.cycles.screening}).exec();
        if (screening){        
          if (new Date(fromDate) <= new Date(screening.date_created) 
              && new Date(screening.date_created) <= new Date(toDate))
            ids.push(screening.client)
        }

      }

  }  

  let clients = await ClientDal.getCollection({
    _id: { $in: ids.slice() }
  })

  return clients;

  }


  //Helper Functions
  async function getStatuses(stage){
    let statusList = [];
    switch (stage){
      case "new": statusList.push("new"); return statusList; break;
      case "screening": statusList.push("screening_in_progress","eligible"); return statusList; break;
      case "loanApplication": statusList.push ("loan_application_new", 
                                  "loan_application_inprogress",
                                  "loan_application_accepted"); return statusList; break;
      case "acat": statusList.push ("ACAT new", "ACAT_IN_PROGRESS", "ACAT_AUTHORIZED"); return statusList; break;
      case "loanGranted": statusList.push("Loan Granted"); return statusList; break;
      case "loanPaid": statusList.push ("Loan Paid"); return statusList; break;

      
    }
    return statusList;
  }

  async function getTheLastLoanCycleDateAndCrop(client){
    let response = {}
    let history = await History.findOne({
      client: client._id
    }).exec();
    if (history != null){
      let cycle =  history.cycles.find(item => item.cycle_number == client.loan_cycle_number);
      if (cycle){
        if (cycle.screening){
          let screening = await Screening.findOne({_id: cycle.screening}).exec();
          response.loanProcessStartedAt = screening.date_created;
        } 
        if (cycle.acat){
          response.crops = "";
          let currentACAT = await ClientACAT.findOne({_id:cycle.acat}).exec();
          if (currentACAT){        
            for (let acat of currentACAT.ACATs){
              let cropACAT = await ACAT.findOne({_id: acat}).populate("crop").exec();            
              if (response.crops === "")
                response.crops += cropACAT.crop.name
              else {response.crops = response.crops + ", " + cropACAT.crop.name;}
            }
          }
        }
      }
    }

    return response;
  }

  function intersect(clientSet1, clientSet2){
    return clientSet1.filter(client1 => 
      (clientSet2.some(client2 => (client2._id.toString() == client1._id.toString()))));

  }

}


/**
 * Get a collection of loan granted clients
 */
function* viewClientLoancycleStats(ctx, reportType) {
  debug('get client loan cycle stats');

  try {
    let stats;

    //ctx.query.client = "5bbdfe638a878c00014d4ca8";
    if (ctx.query.client) {
      let query = {
        _id: ctx.query.client
      };
      let client = yield ClientDal.get(query);
      if (!client) {
        let err = new Error("Client Does Not Exist!");
        err.type = 'CLIENT_LOAN_CYCLE_STATS';
        throw err;
      }

      let history = yield HistoryDal.get({
        client: client._id
      });

      stats = yield getStats(client, history);

    } else {
      // retrieve pagination query params
      let page   = ctx.query.page || 1;
      let limit  = ctx.query.per_page || 200;

      let sortType = ctx.query.sort_by;
      let sort = {};
      sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

      let opts = {
        page: +page,
        limit: +limit,
        sort: sort
      };
      let query = {};

      let clients = yield ClientDal.getCollectionByPagination(query, opts);

      stats = {
        total_pages: clients.total_pages,
        total_docs_count: clients.total_docs_count,
        current_page: clients.current_page,
        data: []
      }

      for(let client of clients.docs) {
        let history = yield HistoryDal.get({
          client: client._id
        });
        if (!history) {continue;}
        let stat =  yield getStats(client, history)
        stats.data.push(stat);
      }
    }
     
    async function getStats(client, history) {
      let data = {
        client: `${client.first_name} ${client.last_name} ${client.grandfather_name}`,
        date: moment().format('MMMM DD, YYYY'),
        loan_cycles: []
      }
      //for each history cycle
      for(let cycle of history.cycles) {
        if (!cycle.acat) { continue; }
        let clientACAT = await ClientACAT.findOne({ _id: cycle.acat }).exec();
        let loanProposal = await LoanProposal.findOne({ client_acat: clientACAT._id }).exec();
        let acats = await ACATDal.getCollection({ _id: { $in: clientACAT.ACATs }});
        let crops = acats.map(function (acat){
          return {"name": acat.crop.name};
        });
        let stat = {
          crops: crops,
          loan_cycle_no: cycle.cycle_number,
          estimated_total_cost: clientACAT.estimated.total_cost,
          estimated_total_revenue: clientACAT.estimated.total_revenue,
          actual_total_cost: clientACAT.achieved.total_cost,
          actual_total_revenue: clientACAT.achieved.total_revenue,
          estimated_net_profit: clientACAT.estimated.total_revenue - clientACAT.estimated.total_cost,
          actual_net_profit: clientACAT.achieved.total_revenue - clientACAT.achieved.total_cost,
          loan_requested: loanProposal ? loanProposal.loan_requested : 0,
          loan_approved: loanProposal ?  loanProposal.loan_approved : 0
        }

        data.loan_cycles.push(stat);
      }

      return data;
    }

    yield ReportDal.create({
      type: reportType._id,
      data: stats
    })

    return stats;

  } catch(ex) {
    ex.type = 'CLIENT_LOAN_CYCLE_STATS';
    throw ex;
  }
}

/**
 * Get a collection of loan granted clients
 */
async function viewByBranch(ctx, reportType) {
  debug('get a collection of clients by branches');


  // retrieve pagination query params
  let page   = ctx.query.page || 1;
  let limit  = ctx.query.per_page || 10;
  let query = {
    gender: ctx.query.type
  };

  let sortType = ctx.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  await hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  await hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;
    let stats = [];

    let branches = await Branch.find({}).exec();

    for(let branch of branches) {
      let count = await Client.count({
        branch: branch._id
      }).exec();

      stats.push({
        _id: branch._id,
        name: branch.name,
        no_of_clients: count
      })
    }

    await ReportDal.create({
      type: reportType._id,
      data: stats
    })

    return stats;

  } catch(ex) {
    throw ex;
  }
}

/**
 * Get a collection of loan granted clients
 */
async function viewByGender(ctx, reportType) {
  debug('get a collection of clients by gender');

  ctx.checkBody("Gender")
      .notEmpty('Gender is Empty');
  
  let parameters = []; let query = {};

  if (ctx.request.body.Gender){
    parameters.push({"label":"Gender", "value":ctx.request.body.Gender});
    query.gender = ctx.request.body.Gender;
  }
  if (ctx.request.body.Status){
    parameters.push({"label":"Status", "value":ctx.request.body.Status});
    query.status = ctx.request.body.Status
  }
  

  
  
  if(ctx.errors) {
    throw new Error(JSON.stringify(ctx.errors));
  }

  // retrieve pagination query params
  //let page   = ctx.query.page || 1;
  //let limit  = ctx.query.per_page || 10;
  // let query = {
  //   gender: ctx.request.body.Gender,
  //   status: ctx.request.body.status
  // };

  let sortType = ctx.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  // let opts = {
  //   page: +page,
  //   limit: +limit,
  //   sort: sort
  // };

  let canViewAll =  await hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  await hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = await Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        //query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // Can VIEW
    } else if(canView) {
        query.created_by = user._id;

    // DEFAULT
    } else {
      query.created_by = user._id;
    }

    let clients = await ClientDal.getCollection(query);
    let result = {}; result.data={};
    // set date modifications
    let currentDate = moment().format('MMMM DD, YYYY');
    result.data.date = currentDate;
    
    result.data.clients = []; result.data.parameters = [];
    result.data.parameters = parameters; let i = 1;
    for (let client of clients){
      client._doc.No = i; 
      if (config.STATUS_CONSTANTS[client._doc.status])    
        client._doc.status = config.STATUS_CONSTANTS[client._doc.status];
      result.data.clients.push(client._doc);
      i++;
    }

    await ReportDal.create({
      type: reportType._id,
      data: clients
    })

    return result;

  } catch(ex) {
    throw ex;
  }
}

/**
 * View loan cycle stages stats
 * // /reports/stage/stats
 */
async function viewCropsStats(ctx, reportType) {
  debug('get loan cycle crops stats');


  let canViewAll =  await hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  await hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = await Account.findOne({ user: user._id }).exec();

    // Super Admin
    if (!account || (account.multi_branches && canViewAll)) {
        //query = {};

    // Can VIEW ALL
    } else if (canViewAll) {
      if(account.access_branches.length) {
          query.branch = { $in: account.access_branches };

      } else if(account.default_branch) {
          query.branch = account.default_branch;

      }

    // DEFAULT
    } else {
      query.created_by = user._id;
    }

    // @TODO improve with aggregation
    let stats = [];
    let crops = await Crop.find({}).exec();

    for(let crop of crops) {
      let acats = await ACAT.find({
        crop: crop
      }).exec();

      let totalLoanAmount = 0;
      let totalClients = acats.length;

      for(let acat of acats) {
        let loanProposals = await LoanProposal.find({
          client: acat.client
        }).exec();

        for(let proposal of loanProposals) {
          totalLoanAmount += +proposal.loan_approved
        }
      }

      stats.push({
        crop: crop.name,
        no_of_clients: totalClients,
        total_loan_amount: totalLoanAmount
      })
    }

    await ReportDal.create({
      type: reportType._id,
      data: stats
    })

    return stats;

  } catch(ex) {
    throw ex;
  }
}

/**
 * View loan cycle stages stats
 * // /reports/stage/stats
 */
async function viewStagesStats(ctx, reportType) {
  debug('get loan cycle stages stats');

  try {
    let user = ctx.state._user;

    // Proxy via History Model
    // @TODO Improve with aggregation
    let screeningCount  = await History.count({
      cycle: { loan: null, acat: null }
    }).exec();

    let loanCount  = await History.count({
      cycle: { acat: null }
    }).exec();

    let acatCount = await History.$where(function(){
        let currentCycleACAT = false;

        for(let cycle of this.cycles) {
          if ((this.cycle_number === cycle.cycle_number) && !!cycle.acat) {
            currentCycleACAT = true;
            break;
          }
        }

        return currentCycleACAT === true;
    }).exec();

    let stats = {
      clients_under_screening: screeningCount,
      clients_under_loan: loanCount,
      clients_under_acat: acatCount.length
    };

    await ReportDal.create({
      type: reportType._id,
      data: stats
    });

    return stats;

  } catch(ex) {
    throw ex;
  }
}

/**
 * Get a collection of loan granted clients
 */
async function viewByStage(query, loanStage) {
  debug('get a collection of clients by loan cycle stage');

  const ACCEPTED_STAGES = ["screening","loan","acat"];

  // ctx.checkQuery("name")
  //     .notEmpty('Loan cycle Stage name is Empty')
  //     .isIn(ACCEPTED_STAGES, `Accepted stages are ${ACCEPTED_STAGES.join(",")}`);

  // if(ctx.errors) {
  //   throw new Error(JSON.stringify(ctx.errors))
  // }

  // retrieve pagination query params
  // let page   = ctx.query.page || 1;
  // let limit  = ctx.query.per_page || 10;
  // let query = {};

  // let sortType = ctx.query.sort_by;
  // let sort = {};
  // sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    // page: +page,
    // limit: +limit,
    // sort: sort
  };


  try {
    // let user = ctx.state._user;

    // let account = await Account.findOne({ user: user._id }).exec();

    // Proxy via History Model
    let histories;
    query = { cycles: {} };

    if (loanStage === "screening") {
      query.cycles = { loan: null, acat: null };
      histories = await HistoryDal.getCollectionByPagination(query, opts);

    } else if (loanStage === "loan") {
      query.cycles = { acat: null };
      histories = await HistoryDal.getCollectionByPagination(query, opts);

    } else if (loanStage === "acat") {
      histories = await HistoryDal.getWhere(function(){
        let currentCycleACAT = false;

        for(let cycle of this.cycles) {
          if ((this.cycle_number === cycle.cycle_number) && !!cycle.acat) {
            currentCycleACAT = true;
            break;
          }
        }

        return currentCycleACAT === true;
      }, opts);

    }

    let clientIds = [];
    for(let hist of histories.docs) {
      clientIds.push(hist.client._id)
    }

    let clients = [];
    if (clientIds.length > 0){
      clients = await ClientDal.getCollection({
        _id: { $in: clientIds.slice() }
      }, opts);
    }

    // await ReportDal.create({
    //   type: reportType._id,
    //   data: clients
    // });

    return clients;

  } catch(ex) {
    throw ex;
  }
}

/**
 * Get a clients by crop
 */
async function viewByCrops(ctx, reportType) {
  debug('get a collection of clients by crop');

  // retrieve pagination query params
  let page   = ctx.query.page || 1;
  let limit  = ctx.query.per_page || 10;
  let query = {};

  let sortType = ctx.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  await hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  await hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = await Account.findOne({ user: user._id }).exec();

    let clients;

    // @TODO use aggregation pipeline instead of this mess
    if (ctx.query.crop) {
      
      let crop = await Crop.findOne({ _id: ctx.query.crop }).exec();
      let acats = await ACATDal.getCollectionByPagination({
        crop: crop._id
      }, opts);

      let ids = [];
      for(let acat of acats.docs) {
        ids.push(acat.client)
      }

      clients = await ClientDal.getCollectionByPagination({
        _id: { $in: ids.slice() }
      }, opts)

    } else {
      let crops = await Crop.find({}).exec();

      let ACATs = await ACAT.aggregate().group({
        _id: "$crop",
        count: { $sum: 1 },
        clients: { $push: "$client"}
      }).exec();

      clients = [];

      for(let acat of ACATs) {
        let _clients = await Client.find({
          _id: { $in: acat.clients.slice() }
        }).exec();
        let crop = await Crop.findOne({ _id: acat._id });
        let clientStats = [];

        for(let _client of _clients) {
          let history = await History.findOne({ client: _client._id }).exec();
          if (!history) { continue; }
          //for each history cycle
          for(let cycle of history.cycles) {
            if (cycle.cycle_number != history.cycle_number) { continue; }
            if (!cycle.acat) { continue; }
            let clientACAT = await ClientACAT.findOne({ _id: cycle.acat }).exec();
            let loanProposal = await LoanProposal.findOne({ client_acat: clientACAT._id }).exec();
            let stat = {
              client: `${_client.first_name} ${_client.last_name} ${_client.grandfather_name}`,
              loan_cycle_no: cycle.cycle_number,
              estimated_total_cost: clientACAT.estimated.total_cost,
              estimated_total_revenue: clientACAT.estimated.total_revenue,
              actual_total_cost: clientACAT.achieved.total_cost,
              actual_total_revenue: clientACAT.achieved.total_cost,
              loan_requested: loanProposal ? loanProposal.loan_requested : 0,
              loan_approved: loanProposal ?  loanProposal.loan_approved : 0
            };

            clientStats.push(stat);
          }
        }

        clients.push({
          crop: crop.name,
          clients: clientStats,
          total: _clients.length
        })
      }
    }
    
    await ReportDal.create({
      type: reportType._id,
      data: clients
    });

    return clients;

  } catch(ex) {
    throw ex;
  }
}
