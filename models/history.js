// History Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var HistorySchema = new Schema({       
    client:        { type: Schema.Types.ObjectId, ref: 'Client'},
    screenings:     [{ type: Schema.Types.ObjectId, ref: 'Screening'}],
    loans:          [{ type: Schema.Types.ObjectId, ref: 'Loan'}],
    acats:          [{ type: Schema.Types.ObjectId, ref: 'ClientACAT'}],
    group_loans:    [{ type: Schema.Types.ObjectId, ref: "GroupLoan"}],
    started_by:     { type: Schema.Types.ObjectId, ref: 'User' },
    last_edit_by:   { type: Schema.Types.ObjectId, ref: 'User' },
    branch:         { type: Schema.Types.ObjectId, ref: 'Branch' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
HistorySchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
HistorySchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter History Attributes to expose
 */
HistorySchema.statics.attributes = {
  client: 1,
  screenings: 1,
  started_by: 1,
  last_edit_by: 1,
  loans: 1,
  acats: 1,
  branch: 1,
  group_loans: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose History model
module.exports = mongoose.model('History', HistorySchema);