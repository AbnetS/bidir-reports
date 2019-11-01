'use strict';
// Access Layer for Crop Data.

/**
 * Load Module Dependencies.
 */
const debug   = require('debug')('api:dal-crop');
const moment  = require('moment');
const _       = require('lodash');
const co      = require('co');

const Crop    = require('../models/crop');
const mongoUpdate   = require('../lib/mongo-update');

var returnFields = Crop.attributes;
var population = [];

/**
 * create a new crop.
 *
 * @desc  creates a new crop and saves them
 *        in the database
 *
 * @param {Object}  cropData  Data for the crop to create
 *
 * @return {Promise}
 */
exports.create = function create(cropData) {
  debug('creating a new crop');

  return co(function* () {

    let unsavedCrop = new Crop(cropData);
    let newCrop = yield unsavedCrop.save();
    let crop = yield exports.get({ _id: newCrop._id });

    return crop;


  });

};

/**
 * delete a crop
 *
 * @desc  delete data of the crop with the given
 *        id
 *
 * @param {Object}  query   Query Object
 *
 * @return {Promise}
 */
exports.delete = function deleteCrop(query) {
  debug('deleting crop: ', query);

  return co(function* () {
    let crop = yield exports.get(query);
    let _empty = {};

    if(!crop) {
      return _empty;
    } else {
      yield crop.remove();

      return crop;
    }

  });
};

/**
 * update a crop
 *
 * @desc  update data of the crop with the given
 *        id
 *
 * @param {Object} query Query object
 * @param {Object} updates  Update data
 *
 * @return {Promise}
 */
exports.update = function update(query, updates) {
  debug('updating crop: ', query);

  let now = moment().toISOString();
  let opts = {
    'new': true,
    select: returnFields
  };

  updates = mongoUpdate(updates);

  return Crop.findOneAndUpdate(query, updates, opts)
      .populate(population)
      .exec();
};

/**
 * get a crop.
 *
 * @desc get a crop with the given id from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.get = function get(query, crop) {
  debug('getting crop ', query);

  return Crop.findOne(query, returnFields)
    .populate(population)
    .exec();

};

/**
 * get a collection of crops
 *
 * @desc get a collection of crops from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollection = function getCollection(query, qs) {
  debug('fetching a collection of crops');

  return new Promise((resolve, reject) => {
    resolve(
     Crop
      .find(query, returnFields)
      .populate(population))
      //.stream());
  });


};

/**
 * get a collection of crops using pagination
 *
 * @desc get a collection of crops from db
 *
 * @param {Object} query Query Object
 *
 * @return {Promise}
 */
exports.getCollectionByPagination = function getCollection(query, qs) {
  debug('fetching a collection of crops');

  let opts = {
    select:  returnFields,
    sort:   qs.sort || {},
    populate: population,
    page:     qs.page,
    limit:    qs.limit
  };


  return new Promise((resolve, reject) => {
    Crop.paginate(query, opts, function (err, docs) {
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
