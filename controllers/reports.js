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
const Crop            = require('../models/crop');
const ACAT            = require('../models/ACAT');
const Client            = require('../models/client');
const LoanProposal            = require('../models/loanProposal');

const TokenDal           = require('../dal/token');
const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const ScreeningDal       = require('../dal/screening');
const FormDal            = require('../dal/form');
const AccountDal         = require('../dal/account');
const QuestionDal        = require('../dal/question');
const SectionDal         = require('../dal/section');
const HistoryDal         = require('../dal/history');
const ACATDal         = require('../dal/ACAT');

let hasPermission = checkPermissions.isPermitted('REPORT');

/**
 * Get a collection of loan granted clients
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.viewByGender = function* viewByGender(next) {
  debug('get a collection of clients by gender');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_GENDER_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  this.checkQuery("type")
      .notEmpty('Gender is Empty');

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_GENDER_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }
  

  if(this.query.format) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_GENDER_ERROR',
      message: `${this.query.format} not yet implemented!`
    }));
  }

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {
    gender: this.query.type
  };

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');


  try {
    let user = this.state._user;

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

    this.body = clients;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_GENDER_ERROR',
      message: ex.message
    }));
  }
};

/**
 * View loan cycle stages stats
 * // /reports/stage/stats
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.viewCropsStats = function* viewCropsStats(next) {
  debug('get loan cycle crops stats');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_CROP_STATS_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }


  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');


  try {
    let user = this.state._user;

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

    this.body = stats;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_CROP_STATS_ERROR',
      message: ex.message
    }));
  }
};



/**
 * View loan cycle stages stats
 * // /reports/stage/stats
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.viewStagesStats = function* viewStagesStats(next) {
  debug('get loan cycle stages stats');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_LOAN_CYCLE_STAGES_STATS_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }


  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');


  try {
    let user = this.state._user;

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


    this.body = {
      clients_under_screening: screeningCount,
      clients_under_loan: loanCount,
      clients_under_acat: acatCount.length
    };

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_LOAN_CYCLE_STAGES_STATS_ERROR',
      message: ex.message
    }));
  }
};




/**
 * Get a collection of loan granted clients
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.viewByStage = function* viewByStage(next) {
  debug('get a collection of clients by loan cycle stage');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_LOAN_CYCLE_STAGE_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  const ACCEPTED_STAGES = ["screening","loan","acat"];

  this.checkQuery("name")
      .notEmpty('Loan cycle Stage name is Empty')
      .isIn(ACCEPTED_STAGES, `Accepted stages are ${ACCEPTED_STAGES.join(",")}`);

  if(this.errors) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_LOAN_CYCLE_STAGE_ERROR',
      message: JSON.stringify(this.errors)
    }));
  }

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');


  try {
    let user = this.state._user;

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
    if (this.query.name === "screening") {
      query.cycles = {
        loan: null,
        acat: null
      }
      histories = yield HistoryDal.getCollectionByPagination(query, opts);

    } else if (this.query.name === "loan") {
      query.cycles = {
        acat: null
      }
      histories = yield HistoryDal.getCollectionByPagination(query, opts);

    } else if (this.query.name === "acat") {
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

    this.body = clients;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_LOAN_CYCLE_STAGE_ERROR',
      message: ex.message
    }));
  }
};

/**
 * Get a clients by crop
 *
 * @desc Fetch a collection of clients
 *
 * @param {Function} next Middleware dispatcher
 */
exports.viewByCrops = function* viewByCrops(next) {
  debug('get a collection of clients by crop');

  let isPermitted = yield hasPermission(this.state._user, 'VIEW');
  if(!isPermitted) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_CROPS_ERROR',
      message: "You Don't have enough permissions to complete this action"
    }));
  }

  // retrieve pagination query params
  let page   = this.query.page || 1;
  let limit  = this.query.per_page || 10;
  let query = {};

  let sortType = this.query.sort_by;
  let sort = {};
  sortType ? (sort[sortType] = -1) : (sort.date_created = -1 );

  let opts = {
    page: +page,
    limit: +limit,
    sort: sort
  };

  let canViewAll =  yield hasPermission(this.state._user, 'VIEW_ALL');
  let canView =  yield hasPermission(this.state._user, 'VIEW');


  try {
    let user = this.state._user;

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
    if (this.query.id) {
      
      let crop = yield Crop.findOne({ _id: this.query.id }).exec();
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
    
    this.body = clients;

  } catch(ex) {
    return this.throw(new CustomError({
      type: 'VIEW_CLIENTS_BY_CROPS_ERROR',
      message: ex.message
    }));
  }
};
