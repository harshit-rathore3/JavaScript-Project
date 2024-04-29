
const db = require("../models");
const CloudStorage = require("../middlewares/cloudStorage");
const logger = require("../../logger");
const axios = require("axios");
const fs = require("fs");
const { Storage } = require('@google-cloud/storage');

/**
 * Generates a signed URL for a file stored in a Google Cloud Storage bucket.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} req.query - The request query parameters.
 * @param {string} req.query.storageFileName - The name of the file in the storage bucket.
 * @param {string} req.query.projectId - The Google Cloud project ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends the signed URL as the response.
 */
exports.getResourceBucketFileUrl = async (req, res, next) => {
  try {
    const { storageFileName, projectId } = req.query;

    if (!storageFileName) {
      return res.status(400).send("storageFileName not found");
    }
    if (!projectId) {
      return res.status(400).send("projectId not found");
    }

    const cloudStorage = new CloudStorage();
    await cloudStorage.init({ projectId: projectId.toString() });

    const url = await cloudStorage.generateSignedUrl(storageFileName);
    return res.send(url);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the JSON data from a file stored in a Google Cloud Storage bucket.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} req.query - The request query parameters.
 * @param {string} req.query.storageFileName - The name of the file in the storage bucket.
 * @param {string} req.query.projectId - The Google Cloud project ID.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends the JSON data as the response.
 */
exports.getResourceBucketJsonFileData = async (req, res, next) => {
  try {
    const { storageFileName, projectId } = req.query;

    if (!storageFileName) {
      return res.status(400).send("storageFileName not found");
    }
    if (!projectId) {
      return res.status(400).send("projectId not found");
    }

    const cloudStorage = new CloudStorage();
    await cloudStorage.init({ projectId: projectId.toString() });

    const url = await cloudStorage.generateSignedUrl(storageFileName);

    const jsonDataPromise = new Promise(async (resolve, reject) => {
      try {
        const apiResponse = await axios.get(url);
        resolve(apiResponse.data);
      } catch (error) {
        next(error);
      }
    });

    const jsonData = await jsonDataPromise;
    return res.send(jsonData);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a list of Google Cloud Storage buckets.
 *
 * @param {Object} req - The Express request object.
 * @param {Object} req.file - The uploaded GCS file.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends the list of bucket names as the response.
 */
exports.getListOfBuckets = async (req, res, next) => {
  try {
    const gcsFile = req.file;

    if (!gcsFile) {
      return res.status(400).send("gcsFile not found");
    }

    const gcsFileJsonData = JSON.parse(gcsFile.buffer.toString("utf8"));

    const gcsStorage = new Storage({
      credentials: gcsFileJsonData,
      projectId: gcsFileJsonData.project_id
    });

    const gcsBucketsResponse = await gcsStorage.getBuckets();

    const gcsBucketsName = gcsBucketsResponse?.[0]?.map((bucket) => ({
      bucketName: bucket.name
    }));

    return res.send(gcsBucketsName);
  } catch (error) {
    next(error);
  }
};
