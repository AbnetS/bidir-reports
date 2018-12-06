'use strict';
// Access Layer for Report Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-report');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Report        = require('../models/report');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Report.attributes;
var population = [];

/**
 * create a new report.
 *
 * @desc  creates a new report and saves them
 *        in the database
 *
 * @param {Object}  reportData  Data for the report to create
 *
 * @return {Promise}
 */
exports.create = function create(reportData) {
  debug('creating a new report');

  return co(function* () {
    let unsavedReport = new Report(reportData);
    let newReport = yield unsavedReport.save();
    let report = yield exports.get({ _id: newReport._id });

    return report;

  });

};

/**
 * delete a report
 *
 * @desc  delete data of the report with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteReport(query) {
  debug('deleting report: ', query);

  return co(function* () {
    let report = yield exports.get(query);
    let _empty = {};

    if(!report) {
      return _empty;
    } else {
      yield report.remove();

      return report;
    }

  });
};

/**
 * update a report
 *
 * @desc  update data of the report with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating report: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Report.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a report.
 *
 * @desc get a report with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, report) {
  debug('getting report ', query);

  return Report.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of reports
 *
 * @desc get a collection of reports from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of reports');

  return Report.find(query, returnFields)
    .populate(population)
    .exec();


};

/**
 * get a collection of reports using pagination
 *
 * @desc get a collection of reports from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of reports');

  let opts = {
    select:  returnFields,
    sortBy:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Report.paginate(query, opts, function (err, docs) {
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
