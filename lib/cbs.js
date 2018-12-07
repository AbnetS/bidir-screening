'use strict';
/**
 * Load Module Dependencies
 */
let fs    = require('fs');
const url = require('url');

const request = require('request-promise');
const debug = require('debug')('api:cbs');
const pify  = require('pify');
const fse = require('fs-extra');
const $request = require('request');
const moment = require('moment');

fs = pify(fs);

const config = require('../config');

class CBS {
  constructor(config) {
    this.auth_info = null;
    this.config = config || {};
    this.connected = false;
    this.connection_err = null;
  }

  async initialize() {
    try {
      let res = await this._makeRequest({
        username: this.config.username,
        password: this.config.password,
        DeviceID: this.config.device_id
      },'/login')

      this.auth_info = {
        userID: res.userID,
        token: res.token,
        terminalId: res.terminalId
      }

      this.connected = true;
    } catch(ex) {
      this.connection_err = ex.message;
      throw ex;
    }
  }

  async uploadPicture(picturePath) {
    let assetName = (url.parse(picturePath).path).split("/")[2];
    let tmpPath = `/tmp/${assetName}`;
    let tmpFile = fs.createWriteStream(tmpPath);

    await this._downloadAsset(picturePath, tmpFile)

    let data = fs.readFileSync(tmpPath);

    let res = await this._makeRequest({
      image: data.toString("base64")
    },'/picture', {
      "X-Fern-Token": this.auth_info.token
    })

    await fse.remove(tmpPath)

    // pictureId
    return {
      pictureId: res.pictureId
    };
  }

  async uploadID(idPath) {
    let assetName = (url.parse(idPath).path).split("/")[2];
    let tmpPath = `/tmp/${assetName}`;
    let tmpFile = fs.createWriteStream(tmpPath);

    await this._downloadAsset(idPath, tmpFile)

    let data = fs.readFileSync(tmpPath);

    let res = await this._makeRequest({
      image: data.toString("base64")
    },'/picture', {
      "X-Fern-Token": this.auth_info.token
    })

    await fse.remove(tmpPath)

    // pictureId
    return {
      pictureId: res.pictureId
    };
  }

  async createClientX(data) {
    let payload = {
      "customerType": 1,
  "name": "Asmamaw, Melaku",
  "branchID": data.branchId,
  "persons": [
    {
      "title": data.title,
      "gender": 0,
      "forenamePartOne": "Solomon",
      "forenamePartTwo": "Tesema",
      "surname": "Kassahun",
      "dateOfBirth": "01/01/1982",
      "telephone1": "0912568937",
      "pictureID": data.pictureId,
      "cardPictureID": data.cardId
    }
  ],
  "customerAddress": [
    {
      "address": {
        "address1": "Meki",
        "address2": "34",
        "address3": "123",
        "country": "Ethiopia",
        "townCity":"Meki",
        "state":"xxx",
        "county":"yyy",
        "townCityID": "1",
        "countyID": null,
        "stateID": "2",
        "countryID": "3"
      },
      "addressTypeID": 1,
      "dateMovedIn": "05/10/2018",
      "dateMovedOut": null,
      "isPrimary": true
    }
  ],
  "DateJoined":"05/10/2018"
      
    }

    let res = await this._makeRequest(payload,'/customer', {
      "X-Fern-Token": this.auth_info.token
    })

    return res;
  }

  async createClient(data) {
    let payload = {
      "customerType": 1,
      "name": "Asmamaw, Melaku",
      "branchID": data.branchId,
      "persons": [
        {
          "title": data.title,
          "gender": data.client.gender.toLowerCase() == "male" ? 0:1,
          "forenamePartOne": data.client.first_name,
          "forenamePartTwo": data.client.last_name,
          "surname": data.client.grandfather_name,
          "dateOfBirth": moment(data.client.date_of_birth).format("DD/MM/YYYY"),
          "telephone1": data.client.phone,
          "pictureID": data.imgId,
          "cardPictureID": data.cardId
        }
      ],
      "customerAddress": [
        {
          "address": {
            "address1": data.client.woreda,
            "address2": data.client.kebele,
            "address3": data.client.house_no,
            "country": "Ethiopia",
            "townCity": data.client.woreda,
            "state":"xxx",
            "county":"yyy",
            "townCityID": "1",
            "countyID": null,
            "stateID": "2",
            "countryID": "3"
          },
          "addressTypeID": 1,
          "dateMovedIn": moment(data.client.date_created).format("DD/MM/YYYY"),
          "dateMovedOut": null,
          "isPrimary": true
        }
      ],
      "DateJoined":moment(data.client.date_created).format("DD/MM/YYYY"),
      
    }

    console.log(payload)

    let res = await this._makeRequest(payload,'/customer', {
      "X-Fern-Token": this.auth_info.token
    })

    return res;
  }

  async _makeRequest(data, endpoint, headers = {}) {
    let opts = {
      method: 'POST',
      url: `${this.config.url}${endpoint}`,
      json: true,
      body: data,
      headers: headers
    }

    let res = await request(opts);

    return res;
  }

  _downloadAsset(asset, store) {
    return new Promise((resolve, reject) => {
      $request(asset)
        .pipe(store)
        .on("error",(err)=>{
          reject(err)
        })
        .on("finish", ()=>{
          resolve(true)
        });
    })
  }
}





module.exports = CBS;