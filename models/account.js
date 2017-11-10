'use strict';
// Account model Definiton.

/**
 * Load Module Dependencies.
 *
 */
const mongoose  = require('mongoose');
const moment    = require('moment');
const paginator = require('mongoose-paginate');

var Schema = mongoose.Schema;

// New Account Schema model
var AccountSchema = new Schema({
  user:           { type: Schema.Types.ObjectId, ref: 'User' },
  picture:        { type: String, default: '' },
  gender:         { type: String, default: 'SELECT' },
  first_name:     { type: String, default: '' },
  last_name:      { type: String, default: '' },
  email:          { type: String, default: '' },
  phone:          { type: String, default: '' },
  city:           { type: String, default: 'SELECT' },
  country:        { type: String, default: 'SELECT' },
  roles:          [{ type: Schema.Types.ObjectId, ref: 'Role', default: null }],
  default_branch: { type: Schema.Types.ObjectId, ref: 'Branch', default: null },
  access_branches:[{ type: Schema.Types.ObjectId, ref: 'Branch' }],
  date_created:   { type: Date },
  last_modified:  { type: Date }
});

/**
 * Account Attributes to expose
 */
AccountSchema.statics.attributes = {
  user: 1,
  email: 1,
  first_name: 1,
  last_name: 1,
  phone: 1,
  picture: 1,
  gender: 1,
  city: 1,
  country: 1,
  roles: 1,
  default_branch: 1,
  access_branches: 1,
  date_created:   1,
  last_modified: 1
};

// Add middleware to support pagination
AccountSchema.plugin(paginator);

/**
 * Pre save middleware.
 *
 * @desc  - Sets the date_created and last_modified
 *          attributes prior to save.
 */
AccountSchema.pre('save', function preSaveMiddleware(next) {
  let account = this;

  // set date modifications
  let now = moment().toISOString();

  account.date_created = now;
  account.last_modified = now;

  next();

});

// Expose Account model
module.exports = mongoose.model('Account', AccountSchema);
