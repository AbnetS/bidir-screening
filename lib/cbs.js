'use strict';
/**
 * Load Module Dependencies
 */
const request = require('request-promise');
const debug = require('debug')('api:cbs');
const pify  = require('pify');

let fs    = require('fs');

fs = pify(fs);

const config = require('../config');

class CBS {
  constructor(config) {
    this.auth_info = null;
    this.config = config || {};
  }

  async initialize() {
    let res = await this._makeRequest({
      username: this.config.USERNAME,
      password: this.config.PASSWORD,
      DeviceID: this.config.DEVICE_ID
    },'/login')

    this.auth_info = {
      userID: res.userID,
      token: res.token,
      terminalId: res.terminalId
    }
  }

  async uploadPicture(picturePath) {
    let data = await fs.readFile(picturePath);

    let res = await this._makeRequest({
      image: data.toString("base64")
    },'/picture', {
      "X-Fern-Token": this.auth_info.token
    })

    // pictureId
    return {
      pictureId: res.pictureId
    };
  }

  async uploadID(idPath) {
    let data = await fs.readFile(idPath);

    let res = await this._makeRequest({
      image: data.toString("base64")
    },'/picture', {
      "X-Fern-Token": this.auth_info.token
    })

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
          "gender": data.gender.toLowerCase() == "male" ? 0:1,
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

    let res = await this._makeRequest(data,'/customer', {
      "X-Fern-Token": this.auth_info.token
    })

    return res;
  }

  async _makeRequest(data, endpoint, headers = {}) {
    let opts = {
      method: 'POST',
      url: `${this.config.URL}${endpoint}`,
      json: true,
      body: data,
      headers: headers
    }

    let res = await request(opts);

    return res;
  }
}



module.exports = CBS;