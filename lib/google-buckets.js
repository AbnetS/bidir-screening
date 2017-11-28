'use strict';
/**
 * Load Module Dependencies
 */
const CloudStorage = require('cloud-storage');
const debug = require('debug')('api:google-buckets-upload');

const config = require('../config');

module.exports = function uploadtoGoogleBuckets(assetPath, fileName) {
  debug(`uploading ${assetPath} with name ${fileName}`);

  let storage = new CloudStorage({
    accessId: config.GOOGLE_BUCKETS.ACCESS_ID,
    privateKey: config.GOOGLE_BUCKETS.KEY
  });

  return new Promise((resolve, reject) => {
    let dir = 'bidir-api-bucket';

    let uploadURL = `gs://${dir}/clients/${fileName}`;

    storage.copy(assetPath, uploadURL, function done(err, url) {
      if(err) return reject(err);

      resolve(url);
    });
  });
};
