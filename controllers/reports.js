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

const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const HistoryDal         = require('../dal/history');
const ACATDal            = require('../dal/ACAT');
const ReportDal          = require('../dal/report');
const ReportTypeDal      = require('../dal/reportType');

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
      CLIENTS_BY_GENDER: viewByGender,
      CLIENTS_BY_BRANCH: viewByBranch,
      CROP_STATS: viewCropsStats,
      LOAN_CYCLE_STAGES_STATS: viewStagesStats,
      CLIENTS_BY_CROPS: viewByCrops,
      LOAN_CYCLE_STAGES: viewByStage,
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
  let report = yield docGenerator.generateDoc(data, template);
  
  let buf = Buffer.from(report);
  
  //***********convert to pdf using the LibreOffice converter library**************/  
  // let libreConverter = new LIBRE_CONVERTER();
  // fs.writeFileSync("./temp/report.docx", report);
  // let pdf = yield libreConverter.convertToPdf("./temp/report.docx");
  // //buf = Buffer.from(pdf);
  // fs.unlinkSync("./temp/report.docx");

  //***********convert to pdf using the docx-wasm pdf converter which has higher quality but needs Internet connection**************/
  let pdfConverter = new PDF_CONVERTER();
  let pdf = yield pdfConverter.convertHelper(report,"exportPDF");
  buf = Buffer.from(pdf);
  

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

  ctx.checkQuery("type")
      .notEmpty('Gender is Empty');

  if(ctx.errors) {
    throw new Error(JSON.stringify(ctx.errors));
  }

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

    let clients = await ClientDal.getCollectionByPagination(query, opts);

    await ReportDal.create({
      type: reportType._id,
      data: clients
    })

    return clients;

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
async function viewByStage(ctx, reportType) {
  debug('get a collection of clients by loan cycle stage');

  const ACCEPTED_STAGES = ["screening","loan","acat"];

  ctx.checkQuery("name")
      .notEmpty('Loan cycle Stage name is Empty')
      .isIn(ACCEPTED_STAGES, `Accepted stages are ${ACCEPTED_STAGES.join(",")}`);

  if(ctx.errors) {
    throw new Error(JSON.stringify(ctx.errors))
  }

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


  try {
    let user = ctx.state._user;

    let account = await Account.findOne({ user: user._id }).exec();

    // Proxy via History Model
    let histories;
    query = { cycles: {} };

    if (ctx.query.name === "screening") {
      query.cycles = { loan: null, acat: null };
      histories = await HistoryDal.getCollectionByPagination(query, opts);

    } else if (ctx.query.name === "loan") {
      query.cycles = { acat: null };
      histories = await HistoryDal.getCollectionByPagination(query, opts);

    } else if (ctx.query.name === "acat") {
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

    let clients = await ClientDal.getCollectionByPagination({
      _id: { $in: clientIds.slice() }
    }, opts);

    await ReportDal.create({
      type: reportType._id,
      data: clients
    });

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
