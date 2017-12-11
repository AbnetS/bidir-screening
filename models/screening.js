// Screening Model Definiton.

/**
 * Load Module Dependencies.
 * status: incomplete, completed, declined, approved, new
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var enums     = require ('../lib/enums');

var Schema = mongoose.Schema;

var ScreeningSchema = new Schema({       
    type:           { type: String, default: 'Screening' },
    description:    { type: String, default: '' },
    title:          { type: String, default: '' },
    answers:        [{ type: Schema.Types.ObjectId, ref: 'Answer'}],
    created_by:     { type: Schema.Types.ObjectId, ref: 'Account' },
    client:         { type: Schema.Types.ObjectId, ref: 'Client' },
    status:         { type: String, default: 'new' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
ScreeningSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ScreeningSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Screening Attributes to expose
 */
ScreeningSchema.statics.attributes = {
  type: 1,
  name: 1,
  title: 1,
  process: 1,
  description: 1,
  answers: 1,
  created_by: 1,
  client: 1,
  status: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Screening model
module.exports = mongoose.model('Screening', ScreeningSchema);