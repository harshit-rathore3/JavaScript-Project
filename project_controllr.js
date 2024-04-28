
// Importing required modules and services
import db from '../models';
import CloudStorage from '../middlewares/cloudStorage';
import logger from '../../logger';
import { decryptGcpDataHelper, encryptGcpDataHelper } from '../services/gcpKeyDataHelperService';
import { generateNewObjectId } from '../services/mongooseHelperService';
import { CLOUD_STORAGE_BUCKET_SCHEMA_GCP_ID, CLOUD_TYPE_GCP } from '../services/constantsService';
import { getResourceStorageFolderPathTillProject } from '../middlewares/cloudStorageFilePaths';
import { createCloudStorageBucket } from '../middlewares/gcs';
import config from '../configs/app.config';
import { isApiTokenScenario, getAPiTokenProjectId } from './apiToken.controller';
import { checkProjectIdIsSameAsInJwtToken, checkProjectIdsIsSameAsInJwtToken } from '../middlewares/apiToken.middleware';

// Defining Mongoose models
const Project = db.project;
const Model = db.model;
const Resource = db.resource;
const ModelGroup = db.modelGroup;
const GCP = db.gcp;
const CloudStorageBucket = db.cloudStorageBucket;

// Function to get a project using its ID
async function getProjectUsingId(id){
    return await Project.findOne({ _id: id });
}
export { getProjectUsingId };

// Other functions related to projects (getAllProjects, getProjectNames, getProjectByID, createProject, updateProject, deleteProject, deleteSelectedProjects) go here...

// The deleteAllProjects function is commented out and seems to be for moderator use only.
// export const deleteAllProjects = (req, res) => {
//     res.status(200).send("Moderator Content.");
// }
