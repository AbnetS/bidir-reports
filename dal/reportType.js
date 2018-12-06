'use strict';
// Access Layer for ReportType Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-reportType');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const ReportType        = require('../models/reportType');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = ReportType.attributes;
var population = [];

/**
 * create a new reportType.
 *
 * @desc  creates a new reportType and saves them
 *        in the database
 *
 * @param {Object}  reportTypeData  Data for the reportType to create
 *
 * @return {Promise}
 */
exports.create = function create(reportTypeData) {
  debug('creating a new reportType');

  return co(function* () {
    let unsavedReportType = new ReportType(reportTypeData);
    let newReportType = yield unsavedReportType.save();
    let reportType = yield exports.get({ _id: newReportType._id });

    return reportType;

  });

};

/**
 * delete a reportType
 *
 * @desc  delete data of the reportType with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteReportType(query) {
  debug('deleting reportType: ', query);

  return co(function* () {
    let reportType = yield exports.get(query);
    let _empty = {};

    if(!reportType) {
      return _empty;
    } else {
      yield reportType.remove();

      return reportType;
    }

  });
};

/**
 * update a reportType
 *
 * @desc  update data of the reportType with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating reportType: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return ReportType.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a reportType.
 *
 * @desc get a reportType with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, reportType) {
  debug('getting reportType ', query);

  return ReportType.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of reportTypes
 *
 * @desc get a collection of reportTypes from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of reportTypes');

   return ReportType.find(query, returnFields)
    .populate(population)
    .exec();


};

/**
 * get a collection of reportTypes using pagination
 *
 * @desc get a collection of reportTypes from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of reportTypes');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    ReportType.paginate(query, opts, function (err, docs) {
      if(err) {
        return reject(err);
      }

      let data = {
        total_pages: docs.pages,
        total_docs_count: docs.total,
        current_page: docs.page,
        docs: docs.docs
      };

      return resolve(data);

    });
  });


};
