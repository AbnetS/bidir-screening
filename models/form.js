// Form Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var enums     = require ('../lib/enums');

var Schema = mongoose.Schema;

var FormSchema = new Schema({       
    type:           { type: String, enum: ['Screening', 'Form Application'] },
    description:    { type: String, default: '' },
    title:          { type: String, default: '' },
    process:        { type: String, default: '' },
    questions:      [{ type: Schema.Types.ObjectId, ref: 'Question'}],
    created_by:     { type: Schema.Types.ObjectId, ref: 'Account' },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
FormSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
FormSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Form Attributes to expose
 */
FormSchema.statics.attributes = {
  type: 1,
  name: 1,
  title: 1,
  process: 1,
  description: 1,
  questions: 1,
  created_by: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Form model
module.exports = mongoose.model('Form', FormSchema);