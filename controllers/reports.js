'use strict';
/**
 * Load Module Dependencies.
 */
const crypto  = require('crypto');
const path    = require('path');
const url     = require('url');

const debug      = require('debug')('api:client-controller');
const moment     = require('moment');
const jsonStream = require('streaming-json-stringify');
const _          = require('lodash');
const co         = require('co');
const del        = require('del');
const validator  = require('validator');
const fs         = require('fs-extra');

const config             = require('../config');
const CustomError        = require('../lib/custom-error');
const checkPermissions   = require('../lib/permissions');
const FORM               = require('../lib/enums').FORM;

const Account            = require('../models/account');
const Question           = require('../models/question');
const Form               = require('../models/form');
const Section            = require('../models/section');
const History            = require('../models/history');
const Crop               = require('../models/crop');
const ACAT               = require('../models/ACAT');
const ClientACAT         = require('../models/clientACAT');
const Client             = require('../models/client');
const LoanProposal       = require('../models/loanProposal');

const TokenDal           = require('../dal/token');
const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const ScreeningDal       = require('../dal/screening');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const QuestionDal        = require('../dal/question');
const SectionDal         = require('../dal/section');
const HistoryDal         = require('../dal/history');
const ACATDal            = require('../dal/ACAT');
const ReportDal          = require('../dal/report');
const ReportTypeDal      = require('../dal/reportType');

let hasPermission = checkPermissions.isPermitted('REPORT');

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
      type: 'VIEW_REPORT_ERROR',
      message: ex.message
    }));
  }

};

// Reports Generator

/**
 * Get a collection of loan granted clients
 */
function* viewClientLoancycleStats(ctx, reportType) {
  debug('get client loan cycle stats');

  ctx.checkQuery("client")
      .notEmpty('Client Reference is Empty');

  if(ctx.errors) {
    throw new Error(JSON.stringify(ctx.errors));
  }


  let query = {
    _id: ctx.query.client
  };


  try {
    let client = yield ClientDal.get(query);
    if (!client) {
      throw new Error("Client Does Not Exist!")
    }

    let history = yield HistoryDal.get({
      client: client._id
    });
    let stats = [];

    //for each history cycle
    for(let cycle of history.cycles) {
      if (!cycle.acat) { continue; }
      let clientACAT = yield ClientACAT.findOne({ _id: cycle.acat }).exec();
      let loanProposal = yield LoanProposal.findOne({ client_acat: clientACAT._id }).exec()
      let stat = {
        loan_cycle_no: cycle.cycle_number,
        estimated_total_cost: clientACAT.estimated.total_cost,
        estimated_total_revenue: clientACAT.estimated.total_revenue,
        actual_total_cost: clientACAT.achieved.total_cost,
        actual_total_revenue: clientACAT.achieved.total_cost,
        loan_requested: loanProposal.loan_requested,
        loan_approved: loanProposal.loan_approved
      }

      stats.push(stat);
    }

    yield ReportDal.create({
      type: reportType._id,
      data: stats
    })

    return stats;

  } catch(ex) {
    throw ex;
  }
};


/**
 * Get a collection of loan granted clients
 */
function* viewByGender(ctx, reportType) {
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

  let canViewAll =  yield hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = yield Account.findOne({ user: user._id }).exec();

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

    let clients = yield ClientDal.getCollectionByPagination(query, opts);

    yield ReportDal.create({
      type: reportType._id,
      data: clients
    })

    return clients;

  } catch(ex) {
    throw ex;
  }
};

/**
 * View loan cycle stages stats
 * // /reports/stage/stats
 */
function* viewCropsStats(ctx, reportType) {
  debug('get loan cycle crops stats');


  let canViewAll =  yield hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = yield Account.findOne({ user: user._id }).exec();

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
    let crops = yield Crop.find({}).exec()

    for(let crop of crops) {
      let acats = yield ACAT.find({
        crop: crop
      }).exec();

      let totalLoanAmount = 0;
      let totalClients = acats.length;

      for(let acat of acats) {
        let loanProposals = yield LoanProposal.find({
          client: acat.client
        }).exec()

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

    yield ReportDal.create({
      type: reportType._id,
      data: stats
    })

    return stats;

  } catch(ex) {
    throw ex;
  }
};



/**
 * View loan cycle stages stats
 * // /reports/stage/stats
 */
function* viewStagesStats(ctx, reportType) {
  debug('get loan cycle stages stats');

  let canViewAll =  yield hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = yield Account.findOne({ user: user._id }).exec();

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

    // Proxy via History Model
    // @TODO Improve with aggregation
    let histories;
    let screeningCount  = yield History.count({
      cycle: {
        loan: null,
        acat: null
      }
    }).exec();
    let loanCount  = yield History.count({
      cycle: {
        acat: null
      }
    }).exec();
    let acatCount = yield History.$where(function(){
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

    yield ReportDal.create({
      type: reportType._id,
      data: stats
    })

    return stats;

  } catch(ex) {
    console.log(ex)
    throw ex;
  }
};




/**
 * Get a collection of loan granted clients
 */
function* viewByStage(ctx, reportType) {
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

  let canViewAll =  yield hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = yield Account.findOne({ user: user._id }).exec();

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

    // Proxy via History Model
    let histories;
    query = { cycles: {} }
    if (ctx.query.name === "screening") {
      query.cycles = {
        loan: null,
        acat: null
      }
      histories = yield HistoryDal.getCollectionByPagination(query, opts);

    } else if (ctx.query.name === "loan") {
      query.cycles = {
        acat: null
      }
      histories = yield HistoryDal.getCollectionByPagination(query, opts);

    } else if (ctx.query.name === "acat") {
      histories = yield HistoryDal.getWhere(function(){
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

    let clientIds = []
    for(let hist of histories.docs) {
      clientIds.push(hist.client._id)
    }

    let clients = yield ClientDal.getCollectionByPagination({
      _id: { $in: clientIds.slice() }
    }, opts);

    yield ReportDal.create({
      type: reportType._id,
      data: clients
    })

    return clients;

  } catch(ex) {
    throw ex;
  }
};

/**
 * Get a clients by crop
 */
function* viewByCrops(ctx, reportType) {
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

  let canViewAll =  yield hasPermission(ctx.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(ctx.state._user, 'VIEW');


  try {
    let user = ctx.state._user;

    let account = yield Account.findOne({ user: user._id }).exec();

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

    let clients;

    // @TODO use aggregation pipeline instead of this mess
    if (ctx.query.crop) {
      
      let crop = yield Crop.findOne({ _id: ctx.query.crop }).exec();
      let acats = yield ACATDal.getCollectionByPagination({
        crop: crop._id
      }, opts);

      let ids = [];
      for(let acat of acats.docs) {
        ids.push(acat.client)
      }

      clients = yield ClientDal.getCollectionByPagination({
        _id: { $in: ids.slice() }
      }, opts)

    } else {
      let crops = yield Crop.find({}).exec();

      let ACATs = yield ACAT.aggregate().group({
        _id: "$crop",
        count: { $sum: 1 },
        clients: { $push: "$client"}
      }).exec()

      clients = [];

      for(let acat of ACATs) {
        let _clients = yield Client.find({
          _id: { $in: acat.clients.slice() }
        }).exec()
        let crop = yield Crop.findOne({ _id: acat._id });

        clients.push({
          crop: crop.toJSON(),
          clients: _clients,
          total: _clients.length
        })
      }
    }
    
    yield ReportDal.create({
      type: reportType._id,
      data: clients
    })

    return clients;

  } catch(ex) {
    throw ex;
  }
};
