
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
const { project: Project, model: Model, resource: Resource, modelGroup: ModelGroup, gcp: GCP, cloudStorageBucket: CloudStorageBucket } = db;

// Function to get a project using its ID
async function getProjectUsingId(id){
    return await Project.findOne({ _id: id });
}
export { getProjectUsingId };

// Other functions for handling projects (getAllProjects, getProjectNames, getProjectByID, createProject, updateProject, deleteProject, deleteSelectedProjects) go here...

