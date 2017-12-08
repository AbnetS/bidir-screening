// Question Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var enums     = require ('../lib/enums');

var Schema = mongoose.Schema;

var QuestionSchema = new Schema({       
    question_text:     { type: String, required: true },
    remark:    { type: String, default: '' },
    type:      { type: String, enums: ['Yes/No', 'Fill In Blank', 'Multiple Choice'] },
    required:  { type: Boolean, default: false },
    options:   [{ type: String }],
    single_choice:   [{ type: String }],
    multiple_choice: [{ type: String }],
    sub_questions:   [{ type: Schema.Types.ObjectId, ref: 'Question'}],
    value:           { type: String, default: '' },
    date_created:    { type: Date },
    last_modified:   { type: Date }
});

// add mongoose-troop middleware to support pagination
QuestionSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
QuestionSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Question Attributes to expose
 */
QuestionSchema.statics.whitelist = {
  question_text: 1,
  remark: 1,
  sub_questions: 1,
  type: 1,
  answer: 1,
  required: 1,
  options: 1,
  single_choice: 1,
  multiple_choice: 1,
  value: 1,
  date_created: 1,
  last_modified: 1,
  _id: 1
};


// Expose Question model
module.exports = mongoose.model('Question', QuestionSchema);