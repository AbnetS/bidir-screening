// Task Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var TaskSchema = new Schema({      
    account:    { type: Schema.Types.ObjectId, ref: 'Account' },
    task:       { type: String },
    task_type:  { type: String },
    status:     { type:String, enums:['Pending','Done']},
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
TaskSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
TaskSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter Task Attributes to expose
 */
TaskSchema.statics.whitelist = {
  __v: 0
};


// Expose Task model
module.exports = mongoose.model('Task', TaskSchema);
