// ReportType Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var ReportTypeSchema = new Schema({       
    title:          { type: String },
    type:           { type: String, unique: true },
    has_parameters: { type: Boolean},
    parameters:     [{
      name: {type: String},
      code: {type: String},
      type: {type: String, enum : [ 'SELECT', 'TEXT', 'DATE','DATERANGE']},
      //options: {
        is_constant: {type: Boolean},
        constants: [{
          send: { type: String },
          display: {type: String}
        }],
        get_from: {type: String}
      //}
    }],
    chart_types:    [{ type: String }],
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
ReportTypeSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ReportTypeSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter ReportType Attributes to expose
 */
ReportTypeSchema.statics.attributes = {
  title: 1,
  type: 1,
  has_parameters: 1,
  parameters: 1,
  chart_types: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose ReportType model
module.exports = mongoose.model('ReportType', ReportTypeSchema);