const db = require("../models");
const CloudStorage = require("../middlewares/cloudStorage");
const logger = require("../../logger");
const axios = require("axios");
const fs = require("fs");
const { Storage } = require('@google-cloud/storage');


exports.getResourceBucketFileUrl = async (req, res, next) => {
  try {
    /**
     * @typedef {Object} RequestQuery
     * @property {string} storageFileName
     * @property {string} projectId
     */

    /** @type {RequestQuery} */
    const requestQuery = req.query;

    if (!requestQuery.storageFileName) {
      return res.status(400).send("storageFileName not found");
    }
    if (!requestQuery.projectId) {
      return res.status(400).send("projectId not found");
    }

    const cloudStorage = new CloudStorage();
    await cloudStorage.init({projectId: requestQuery.projectId.toString()});

    const url = await cloudStorage.generateSignedUrl(
      requestQuery.storageFileName
    );

    return res.send(url);

  } catch (error) {
    next(error);
  }
}

exports.getResourceBucketJsonFileData = async (req, res, next) => {
  try {
    /**
     * @typedef {Object} RequestQuery
     * @property {string} storageFileName
     * @property {string} projectId
     */

    /** @type {RequestQuery} */
    const requestQuery = req.query;

    if (!requestQuery.storageFileName) {
      return res.status(400).send("storageFileName not found");
    }
    if (!requestQuery.projectId) {
      return res.status(400).send("projectId not found");
    }

    const cloudStorage = new CloudStorage();
    await cloudStorage.init({projectId: requestQuery.projectId.toString()});

    const url = await cloudStorage.generateSignedUrl(
      requestQuery.storageFileName
    );

    /** @type {Promise<Object>} */
    const jsonDataPromise = new Promise(async (resolve, reject) => {
      try {
        const apiResponse = await axios.get(url);
        resolve(apiResponse.data);
      } catch (error) {
        next(error);
      }
    })

    const jsonData = await jsonDataPromise

    return res.send(jsonData);

  } catch (error) {
    next(error);
  }
}

exports.getListOfBuckets = async (req, res, next) => {
  try {
    const gcsFile = req.file;

    if (!gcsFile) {
      return res.status(400).send("gcsFile not found");
    }

    /** @type {Object} */
    const gcsFileJsonData = JSON.parse(gcsFile.buffer.toString("utf8"));

    const gcsStorage = new Storage({
      credentials: gcsFileJsonData,
      projectId: gcsFileJsonData.project_id
    })

    const gcsBucketsReponse = await gcsStorage.getBuckets();

    const gcsbucketsName = gcsBucketsReponse?.[0]?.map(bucket=>{
      return {
        bucketName: bucket.name
      }
    })


    return res.send(gcsbucketsName);

  } catch (error) {
    next(error)
  }
}
