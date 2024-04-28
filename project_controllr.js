
// @ts-check
/// <reference path="../../types/mongoose/index.d.ts" />

const db = require("../models");
const CloudStorage = require("../middlewares/cloudStorage");
const logger = require("../../logger");
const { decryptGcpDataHelper, encryptGcpDataHelper } = require("../services/gcpKeyDataHelperService");
const { generateNewObjectId } = require("../services/mongooseHelperService");
const { CLOUD_STORAGE_BUCKET_SCHEMA_GCP_ID, CLOUD_TYPE_GCP } = require("../services/constantsService");
const { getResourceStorageFolderPathTillProject } = require("../middlewares/cloudStorageFilePaths");
const { createCloudStorageBucket } = require("../middlewares/gcs");
const config = require("../configs/app.config");
const { isApiTokenScenario, getAPiTokenProjectId } = require("./apiToken.controller");
const { checkProjectIdIsSameAsInJwtToken, checkProjectIdsIsSameAsInJwtToken } = require("../middlewares/apiToken.middleware");
const Project = db.project;
const Model = db.model;
const Resource = db.resource;
const ModelGroup = db.modelGroup;

/** @type {GCPMongooseModel} */
const GCP = db.gcp;

/** @type {CloudStorageBucketMongooseModel} */
const CloudStorageBucket = db.cloudStorageBucket;
async function getProjectUsingId(id){
  return await Project.findOne({ _id: id })
}
exports.getProjectUsingId = getProjectUsingId;
exports.getAllProjects = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const offset = parseInt(req.query.offset) || 1;
    delete req.query.limit;
    delete req.query.offset;
    const filter = req.query || {};
  
    const projects = await Project.find(filter)
      .skip(limit * offset - limit)
      .limit(limit);
    const totalCount = await Project.countDocuments(filter);

    if (isApiTokenScenario(req)) {
      const projectIds = projects.map(data => data?._id?.toString());
      if (!checkProjectIdsIsSameAsInJwtToken(getAPiTokenProjectId(req), projectIds)) {
        return res.sendStatus(401);
      }
    }
    res.send({ totalCount, projects });
  } catch (error) {
    next(error);
  }
};

exports.getProjectNames = async (req, res, next) => {
  try {
    if(!req.query.projectIds) {
      return res.send([]);
    }
    const projectIds = req.query.projectIds.split(",");
    const projectSelectQuery = req.query.projectSelectQuery;
    
    delete req.query.projectIds;
    delete req.query.projectSelectQuery;

    Project.find({ _id: { $in: projectIds } }, projectSelectQuery ? projectSelectQuery : null ).exec((err, data) => {
      if (err) {
        logger.error(`${err}`);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProjectByID = async(req, res, next) => {
  try {
    if (isApiTokenScenario(req)) {
      if (!checkProjectIdIsSameAsInJwtToken(getAPiTokenProjectId(req), req?.params?.id)) {
        return res.sendStatus(401);
      }
    }
    const id = req.params.id;
    const result = await getProjectUsingId(id)
    if(!result)
      return res.status(404).send(`Project with ${id} is not found`);
    return res.send(result);
  } catch (error) {
    next(error)
  }
};

exports.createProject = async (req, res, next) => {
  try {

    /**
     * @typedef {{
     *  keyData?: string, // encoded string
     *  decodedKeyData?: string,
     *  userWantsToUseOurGCP?: string
     * }} RequestBody
     */

    
    /** @type {RequestBody} */
    const reqBody = req.body;
    
    if (reqBody.decodedKeyData) {
      reqBody.decodedKeyData = JSON.stringify(reqBody.decodedKeyData)
    }
        
    /**
     * @description
     * Either keyData or userWantsToUseOurGCP should be sent, but not both
     */

    if (
      (!reqBody.keyData) &&
      (!reqBody.decodedKeyData) &&
      !reqBody.userWantsToUseOurGCP
    ) {
      return res.status(400).send("keyData or userWantsToUseOurGCP not found");
    }

    /**
     * @type {ProjectMongooseDocument}
     */
    const project = new Project({ ...reqBody });

    if (!reqBody.userWantsToUseOurGCP) {
      let gcpDoc = (()=>{
        if (reqBody.keyData) {
          return new GCP({keyData: reqBody.keyData});
        }
        return new GCP({keyData: encryptGcpDataHelper(reqBody.decodedKeyData || "")});
      })(); 

      const decryptGCPKeyData = (()=>{
        if (reqBody.keyData) {
          return decryptGcpDataHelper(reqBody.keyData);
        }
        return reqBody.decodedKeyData || ""
      })(); 
  
      const bucketName = `auto-ai-${generateNewObjectId()}`;
      const GCPBucket = await createCloudStorageBucket(
        JSON.parse(decryptGCPKeyData),
        bucketName
      );
      gcpDoc = await gcpDoc.save();

      const doesDefaultGCSCloudStorageExistInDB = await CloudStorageBucket.exists({isDefault: true});
  
      /** @type {CloudStorageBucketMongooseDocument} */
      let cloudStorageBucket = new CloudStorageBucket({
        name: bucketName,
        gcpId: gcpDoc._id,
        isDefault: !doesDefaultGCSCloudStorageExistInDB ? true : false
      });
  
      cloudStorageBucket = await cloudStorageBucket.save();

      project.cloudStorageBucketId=cloudStorageBucket._id;
    } else {

      if (config.CLOUD_TYPE === CLOUD_TYPE_GCP) {
        /** @type {CloudStorageBucket} */
        const cloudStorageBucket = await CloudStorageBucket.findOne({isDefault: true}).lean();
        if (!cloudStorageBucket) {
          return res.status(400).send("Default Cloud Storage Bucket not found");
        }
  
        project.cloudStorageBucketId=cloudStorageBucket._id;
      }
    }


    project.save((err, data) => {
      if (err) {
        res.send(err);
      } else {
        res.send(data);
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProject = async (req, res, next) => {
  try {
    const id = req.body.id;
    const update = req.body;
    if (Array.isArray(id)) {
      if (isApiTokenScenario(req)) {
        if (!checkProjectIdsIsSameAsInJwtToken(getAPiTokenProjectId(req), id)) {
          return res.sendStatus(401);
        }
      }

      const filter = { _id: { $in: id } };
      const result = await Project.updateMany(filter, update);
      res.send(result);
    } 
    else {
      if (isApiTokenScenario(req)) {
        if (!checkProjectIdIsSameAsInJwtToken(getAPiTokenProjectId(req), id)) {
          return res.sendStatus(401);
        }
      }
      const result = await Project.findOneAndUpdate({ _id: id }, update, {returnDocument: 'after'});
      res.send(result);
    }
  } catch (error) {
    next(error);
  }
};

exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.body.project}, '_id');

    if (!project) { throw new Error(`project ID is invalid`); }

    const projectId = project._id;

    if (isApiTokenScenario(req)) {
      if (!checkProjectIdIsSameAsInJwtToken(getAPiTokenProjectId(req), projectId.toString())) {
        return res.sendStatus(401);
      }
    }

    const cloudStorage = new CloudStorage();
    await cloudStorage.init({projectId: projectId.toString()});

    const models = await Model.find({ project: projectId}, '_id');

    if (models && models.length>0) {
      for (let index = 0; index < models.length; index++) {
        const model = models[index];
        const modelId = model._id;

        const deleteResourcesResult = await Resource.deleteMany({model: modelId});        
      }
    }
    
    const deleteModelsResult = await Model.deleteMany({project: projectId});      
    
    const deleteProjectRelatedModelGroupsPromise = new Promise(async (resolve, reject)=>{
      try {
        const deleteProjectRelatedModelGroupsResponse = await ModelGroup.deleteMany({
          projectId: projectId
        });
        return resolve(deleteProjectRelatedModelGroupsResponse);
      } catch (error) {
        reject(error);
      }
    })

    const resourceStorageFolderPathTillProject = getResourceStorageFolderPathTillProject(
      projectId
    );

    try {
      const apiResponse = await cloudStorage.deleteResourceDirectory(
        resourceStorageFolderPathTillProject
      )
    } catch (error) {
      logger.error(`${error.message}`);
    }    

    Project.deleteOne({ _id: projectId })
      .then(async (result) => {
        await deleteProjectRelatedModelGroupsPromise;
        res.send(result)
      })
      .catch((err) => logger.error(err));
  } catch (error) {
    next(error);
  }
};

exports.deleteSelectedProjects = (req, res, next) => {
  try {
    Project.remove({ _id: { $in: req.body.projects } })
    .then((result) => res.send(result))
    .catch((err) => logger.error(err));
  } catch (error) {
    next(error);
  }
};

// exports.deleteAllProjects = (req, res) => {
//   res.status(200).send("Moderator Content.");
// }
