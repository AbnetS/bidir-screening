// ACATConfig Model Definiton.

/**
 * Load Module Dependencies.
 */
var mongoose  = require('mongoose');
var moment    = require('moment');
var paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

var ACATConfigSchema = new Schema({       
    cbs:           {
      password: { type: String, default: "p2AjhJA7" },
      username: { type: String, default: "DemoUser11"},
      url: { type: String, default: "https://abacusweb.staging.fernsoftware.com:443/api" },
      device_id: { type: String, default: "Test User Laptop"}
    },
    date_created:   { type: Date },
    last_modified:  { type: Date }
});

// add mongoose-troop middleware to support pagination
ACATConfigSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 *        - Hash tokens password.
 */
ACATConfigSchema.pre('save', function preSaveMiddleware(next) {
  var instance = this;

  // set date modifications
  var now = moment().toISOString();

  instance.date_created = now;
  instance.last_modified = now;

  next();

});

/**
 * Filter ACATConfig Attributes to expose
 */
ACATConfigSchema.statics.attributes = {
  _id: 1,
  cbs: 1
};


// Expose ACATConfig model
module.exports = mongoose.model('ACATConfig', ACATConfigSchema);
