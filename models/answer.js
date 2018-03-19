// Answer Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

const QUESTION   = require('../lib/enums').QUESTION;

var Schema = mongoose.Schema;

var AnswerSchema = new Schema({       
    question_text:      { type: String, required: true },
    number:             { type: Number, default: 1 },
    remark:             { type: String, default: '' },
    type:               { type: String, enums: QUESTION.TYPES, default: QUESTION.TYPES[0] },
    required:           { type: Boolean, default: false },
    validation_factor:  { type: String, default: QUESTION.VALIDATION[0], enums: QUESTION.VALIDATION },
    measurement_unit:   { type: String, default: '' },
    options:            [{ type: String }],
    sub_answers:      [{ type: Schema.Types.ObjectId, ref: 'Answer'}],
    values:             [{ type: String, default: '' }],
    show:               { type: Boolean, default: true },
    prerequisites:      [{
      answer:   { type: String },
      question: { type: Schema.Types.ObjectId, ref: 'Answer' }
    }],
    date_created:       { type: Date },
    last_modified:      { type: Date }
});

// add mongoose-troop middleware to support pagination
AnswerSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
AnswerSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Answer Attributes to expose
 */
AnswerSchema.statics.attributes = {
  question_text:      1,
  remark:             1,
  number:             1,
  type:               1,
  required:           1,
  validation_factor:  1,
  measurement_unit:   1,
  options:            1,
  sub_answers:        1,
  values:             1,
  show:               1,
  prerequisites:      1,
  _id:                1
};


// Expose Answer model
module.exports = mongoose.model('Answer', AnswerSchema);