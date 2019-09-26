'use strict'
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

const BranchDal          = require('../dal/branch');
const ClientDal          = require('../dal/client');
const LogDal             = require('../dal/log');
const HistoryDal         = require('../dal/history');
const ACATDal            = require('../dal/ACAT');
const ReportDal          = require('../dal/report');
const ReportTypeDal      = require('../dal/reportType');

const config             = require('../config/index');

let hasPermission = checkPermissions.isPermitted('REPORT');

exports.fetchAllBranches = function* fetchAllBranches(next) {
    debug('get a collection of branches by pagination');
  
    let isPermitted = yield hasPermission(this.state._user, 'VIEW');
    if(!isPermitted) {
      return this.throw(new CustomError({
        type: 'VIEW_BRANCHES_COLLECTION_ERROR',
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
  
    try {
  
      let user = this.state._user;
      let account = yield Account.findOne({ user: user._id }).exec();
  
      if(account) {
        if(!account.multi_branches) {
          if(account.access_branches.length) {
            query._id = { $in: account.access_branches };
  
          } else if(account.default_branch) {
            query._id = account.default_branch;
  
          }
        }
      }
  
      let branches = yield BranchDal.getCollectionByPagination(query, opts);

      let returnBranches = [];

      for (let branch of branches.docs){
          let returnBranch = {};
          returnBranch.send = branch._id;
          returnBranch.display = branch.name;
          returnBranches.push (returnBranch);
      }
  
      this.body = returnBranches;
  
    } catch(ex) {
      return this.throw(new CustomError({
        type: 'VIEW_BRANCHES_COLLECTION_ERROR',
        message: ex.message
      }));
    }
  };


  exports.fetchAllCrops = function* fetchAllCrops(next) {
    debug('get a collection of branches by pagination');
  
    let isPermitted = yield hasPermission(this.state._user, 'VIEW');
    if(!isPermitted) {
      return this.throw(new CustomError({
        type: 'VIEW_BRANCHES_COLLECTION_ERROR',
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
  
    try {
  
      let user = this.state._user;
      let account = yield Account.findOne({ user: user._id }).exec();
  
      if(account) {
        if(!account.multi_branches) {
          if(account.access_branches.length) {
            query._id = { $in: account.access_branches };
  
          } else if(account.default_branch) {
            query._id = account.default_branch;
  
          }
        }
      }
  
      let branches = yield BranchDal.getCollectionByPagination(query, opts);

      let returnBranches = [];

      for (let branch of branches.docs){
          let returnBranch = {};
          returnBranch.send = branch._id;
          returnBranch.display = branch.name;
          returnBranches.push (returnBranch);
      }
  
      this.body = returnBranches;
  
    } catch(ex) {
      return this.throw(new CustomError({
        type: 'VIEW_BRANCHES_COLLECTION_ERROR',
        message: ex.message
      }));
    }
  };





