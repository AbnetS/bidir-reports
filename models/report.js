// Report Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var ReportSchema = new Schema({       
    data:           { type: Schema.Types.Mixed },
    type:           { type: Schema.Types.ObjectId, ref: "ReportType" },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
ReportSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ReportSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Report Attributes to expose
 */
ReportSchema.statics.attributes = {
  data: 1,
  type: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Report model
module.exports = mongoose.model('Report', ReportSchema);