const cors = require("cors"); 
const express = require("express");
const http = require("http");
const morgan = require("morgan");
const cookieParser = require('cookie-parser');
const { errorHandler } = require("./app/middlewares/errorHandler");
const swaggerUi = require('swagger-ui-express');
const { MODEL_GROUPS_ROUTE_ENDPOINT, secondsAfterWhichDataSetCopyProcessShouldBeResumed } = require("./app/services/constantsService");
// db connection
const db = require("./app/models");
const CoPilotResource = db.coPilotResource;
const {
    CO_PILOT_RESOURCE_STATUS_ACTIVE,
    CO_PILOT_RESOURCE_STATUS_EXPIRED,
} = require("./app/configs/app.config");
const { COPILOT_CHANGE_INITIATED_BY_ENTITY_SYSTEM } = require("./app/services/constantsService");
const { SOCKET_EVENT_CO_PILOT_RESOURCES_UPDATED } = require("./app/services/socketHelperService");
/** @type {CloudStorageBucketMongooseModel} */
const CloudStorageBucket = db.cloudStorageBucket;

/** @type {GCPMongooseModel} */
const GCP = db.gcp;

const CoPilot = db.coPilot;
const Model = db.model;
const socketIo = require("socket.io");

// importing configs and loggers
const appConfig = require("./app/configs/app.config");
const dbConfig = require("./app/configs/db.config"); 
const logger = require("./logger");

const app = express();
const router = express.Router();

logger.info(`env variables: ${JSON.stringify(process.env)}`);

const RsaEncrypter = require("./app/services/rsaHelperService");
const rsaEncrypter = new RsaEncrypter(appConfig.GCP_DATA_SECRET_PRIVATE_KEY);


const productKeyMiddleware = require("./app/middlewares/productKey-middleware");

app.use(cookieParser());

app.use(cors({
    origin: function(origin, callback) {
        callback(null, true)
    },
    credentials: true
}));

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(
    morgan("dev", {
        stream: {
            write: (message) => logger.info(message),
        },
    })
);



let hasSetDefaultGcsStorageFromEnvVariable = false;

db.mongoose
    .connect(dbConfig.MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        user: dbConfig.MONGODB_USER,
        pass: dbConfig.MONGODB_PASS
    })
    .then(() => {
        logger.info(
            `Mongoose default connection is open to ${dbConfig.MONGODB_URL}`
        )
        if (
            appConfig.DEFAULT_GCP_BUCKET_CONNECTION_JSON_STRING &&
            !hasSetDefaultGcsStorageFromEnvVariable
        ) {
            setDefaultGcsStorageIfNotAlreadySetFromEnvVariable()
        }
    }
    )
    .catch((err) => logger.error(`${err}`));
db.mongoose.connection.on("disconnected", () => {
    logger.error("Mongoose default connection is disconnected");
});
db.mongoose.connection.on("disconnecting", () => {
    logger.error("Mongoose default connection is disconnecting");
});
db.mongoose.connection.on("reconnected", () => {
    logger.error("Mongoose default connection is reconnected");
});
db.mongoose.connection.on("reconnectFailed", () => {
    logger.error("Mongoose default connection reconnectFailed event");
});
db.mongoose.connection.on("reconnectTries", () => {
    logger.error("Mongoose default connection reconnectTries event");
});
db.mongoose.connection.on("close", () => {
    logger.error("Mongoose default connection close event");
});
db.mongoose.connection.on("error", (err) => {
    logger.error(`Mongoose default connection error event: ${JSON.stringify(err)}`);
});

// Starting http server
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } })

app.use((req, res, next) => {
    req.io = io;
    return next();
});

if (appConfig.disableProductKeyCheck !== "yes") {
    app.all("*", (req, res, next)=>{
        if(
            appConfig.disableProductKeyCheck !== "yes" &&
            req.url !== `/productKeys/register` && req.url !== `/user/logout` && req.url !== `/productKeys/isProductKeyValidAndRegistered`
        ){
            productKeyMiddleware.isProductKeyRegisteredInClientServerMiddleware(req,res, next)
            // res.json({
            //     reqPath: req.path
            // })
        }
        else{
            next()
        }
    })
}

// const clientServerDomain = appConfig.AUTO_AI_BACKEND_DOMAIN;

server.listen(
    appConfig.AUTO_AI_SERVICE_PORT,
    appConfig.AUTO_AI_SERVICE_HOST,
    () => {
        logger.info(
            `Server running at http://${appConfig.AUTO_AI_SERVICE_HOST}:${appConfig.AUTO_AI_SERVICE_PORT}/`
        );
    }
);

let isCopilotResourceStatusUpdating = false;

app.use(async (req, res, next) => {
    next();
    if (!isCopilotResourceStatusUpdating && !appConfig.isDevMode) {
        isCopilotResourceStatusUpdating = true;
        const expiredResources = await CoPilotResource.find({
            resourceTimerEndAt: { $lt: Date.now() },
            status: 'active', // Assuming 'active' is the status to be updated
          }).limit(10);
        const updateExpiredResources = await CoPilotResource.updateMany(
            {
                status: CO_PILOT_RESOURCE_STATUS_ACTIVE,
                resourceTimerEndAt: { $lt: Date.now() }
            },
            {
                $set: {
                    status: CO_PILOT_RESOURCE_STATUS_EXPIRED,
                    statusLastModifiedAt: Date.now()
                },
                $addToSet: {
                    changesMade: {
                        _id: generateNewObjectId(),
                        change: "resource status changed to expired",
                        created_at: Date.now(),
                        initiatedByEntity: COPILOT_CHANGE_INITIATED_BY_ENTITY_SYSTEM
                    }
                }
            }
        );

        // await moveCopilotResourceToModelOnExpire()

        if (updateExpiredResources) {
            if (updateExpiredResources.nModified > 0 || updateExpiredResources.modifiedCount > 0) {
                for (const data of expiredResources) {                    
                    logger.info(`create resource api: ${data._id.toString()} got expired`)
                    req.io.emit(SOCKET_EVENT_CO_PILOT_RESOURCES_UPDATED,
                        JSON.stringify({
                            resourceIds: [data._id.toString()],
                            status: CO_PILOT_RESOURCE_STATUS_EXPIRED,
                            copilotId: data.coPilot
                        })
                    )
                }
            }
        }
        isCopilotResourceStatusUpdating = false;
    }
    
})

let isDeletingExpiredCopilotResourcesWhichAreApplicable = false;
app.use(async (req, res, next)=>{
        next();
        if (!isDeletingExpiredCopilotResourcesWhichAreApplicable && !appConfig.isDevMode) {
            try {
                isDeletingExpiredCopilotResourcesWhichAreApplicable = true
                await deleteExpiredCopilotResourcesApplicableForDeletion()
            } catch (error) {
                console.log('app.use ~ isDeletingExpiredCopilotResourcesWhichAreApplicable ~ error:', error)

            }
            isDeletingExpiredCopilotResourcesWhichAreApplicable = false;
        }
})

let isResumingDataSetCopyProcess = false;
app.use(async (req, res, next)=>{
    next();
    if (!isResumingDataSetCopyProcess && !appConfig.isDevMode) {
        isResumingDataSetCopyProcess = true
        try {
            await checkAndResumeDataSetCopyProcess();
        } catch (error) {}
        setTimeout(() => {
            // releasing the lock after some time to not make server suffocate
            isResumingDataSetCopyProcess = false
        }, 10000);
    }

})

const moveCopilotResourceToModelOnExpire = async () => {
    const coPilotResources = await CoPilotResource.aggregate([
        {
            $match: {
             status: 'expired'
            }
           }, {
            $lookup: {
             from: 'copilots',
             localField: 'coPilot',
             foreignField: '_id',
             as: 'copilotsJoined'
            }
           }, {
            $unwind: {
             path: '$copilotsJoined',
             includeArrayIndex: 'index',
             preserveNullAndEmptyArrays: true
            }
           }, {
            $addFields: {
             secondsThreshold: '$copilotsJoined.deleteResourceWhoHaveBeenInExpiredStatusAfterSeconds'
            }
           }, {
            $match: {
             secondsThreshold: {
              $gte: 1
             }
            }
           }, {
            $addFields: {
             noOfSeconds: {
              $toInt: {
               $trunc: {
                $divide: [
                 {
                  $subtract: [
                   new Date(),
                   '$created_at'
                  ],
                 },
                 1000 * 60
                ]
               }
              }
             }
            }
           }
    ]);   

    if (coPilotResources.length) {
        const coPilotResourceIds = coPilotResources.filter(resource =>(resource.noOfSeconds >= resource.secondsThreshold))?.map(obj => obj._id)
        console.log('exports.deleteExpiredCopilotResourcesApplicableForDeletion ~ coPilotResourceIds:', coPilotResourceIds)
        for (const id of coPilotResourceIds) {
            const data = await CoPilotResource.find({_id: id})
            const coPilot = await CoPilot.findOne({
                _id: data.coPilot,
            });
    
            if(coPilot&&coPilot.onDataExpire&&coPilot.onDataExpire.modelIdToSendDataTo) {
                const model = await Model.findOne({
                    _id:  db.mongoose.mongo.ObjectId(coPilot.onDataExpire.modelIdToSendDataTo) ,
                });
                await moveResourceToModelOnExpire( data , model)
            }
        }    

    }
}

// Importing Routes
const userRoute = require("./app/routes/user.route");
const projectRoute = require("./app/routes/project.route");
const uploadDataProcessRoute = require("./app/routes/uploadDataProcess.route");
const modelRoute = require("./app/routes/model.route");
const resourceRoute = require("./app/routes/resource.route");
const copilotRoute = require("./app/routes/coPilot.route");
const coPilotResourceRoute = require("./app/routes/co-pilot-resource.route");
const csvRoute = require("./app/routes/csv.route");
const collectionRoute = require("./app/routes/collection/collection.route");
const dataSetCopyingToAnotherModelProcessRoute = require("./app/routes/dataSetCopyingToAnotherModelProcess.route");
const migrationRoute = require("./app/routes/migration.route");
const cloudStorageRoute = require("./app/routes/cloud-storage.route");
const slackRoute = require("./app/routes/slack.route");
const utilRoute = require("./app/routes/util.route");
const infoRoute = require("./app/routes/info.route");
const apiTokenRoute = require("./app/routes/apiToken.route");
const productKeyRoute = require("./app/routes/productKey.route")
const modelGroupsRoute = require("./app/routes/modelGroup.route");
const temporaryFilesRoute = require("./app/routes/temporary-files.route")
const { generateNewObjectId } = require("./app/services/mongooseHelperService");
const { encryptGcpDataHelper } = require("./app/services/gcpKeyDataHelperService");
const { createCloudStorageBucket } = require("./app/middlewares/gcs");
const { moveResourceToModelOnExpire, deleteExpiredCopilotResourcesApplicableForDeletion } = require("./app/controllers/co-pilot-resource.controller");
const planogramRoute = require("./app/routes/planogram.route");
const planogramItemsInventoryRoute = require('./app/routes/planogramItemsInventory.route');
const planogramActivityLogs = require("./app/routes/planogramActivityLogs.route");
const planogramProductCompartmentsRoute = require("./app/routes/planogramProductCompartments.route");
const planogramProductsRoute = require("./app/routes/planogramProducts.route");
const { checkAndResumeDataSetCopyProcess } = require("./app/controllers/dataSetCopyingToAnotherModelProcess.controller");
const purposeModelRoute = require("./app/routes/purposeModel.route");
const trainingpodConfigurationRoute = require("./app/routes/trainingpodConfiguration.route")

// Routing API calls
router.use("/productKeys", productKeyRoute(logger));
router.use("/user", userRoute(logger));
router.use("/project", projectRoute(logger));
router.use("/model", modelRoute(logger));
router.use("/resource", resourceRoute(logger));
router.use("/coPilot", copilotRoute(logger));
router.use("/coPilotResource", coPilotResourceRoute(logger));
router.use("/csv", csvRoute(logger));
router.use("/collection", collectionRoute(logger));
router.use("/dataSetCopyingToAnotherModelProcess", dataSetCopyingToAnotherModelProcessRoute(logger));
router.use("/migration", migrationRoute(logger));
router.use("/cloudStorage", cloudStorageRoute(logger));
router.use("/slack", slackRoute(logger));
router.use("/util", utilRoute(logger));
router.use("/info", infoRoute(logger));
router.use("/uploadDataProcesses", uploadDataProcessRoute(logger));
router.use("/apiToken", apiTokenRoute(logger));
router.use(`/${MODEL_GROUPS_ROUTE_ENDPOINT}`, modelGroupsRoute(logger));
router.use("/temporaryFiles", temporaryFilesRoute(logger));
router.use("/planogram", planogramRoute(logger));
router.use('/planogramitemsInventory', planogramItemsInventoryRoute(logger));
router.use("/planogram-activity-logs", planogramActivityLogs(logger));
router.use("/planogramProductCompartments", planogramProductCompartmentsRoute(logger))
router.use("/planogramProducts", planogramProductsRoute(logger))
router.use("/purposeModel", purposeModelRoute(logger));
router.use("/trainingpodConfiguration", trainingpodConfigurationRoute(logger));

/** api endpoint to send gcp data secret public key */
router.get("/dd792a0e", (req, res, next) => {
    res.send(rsaEncrypter.getPublicKey());
})

app.use("/", router);

const swaggerDocument = require('./swagger/swagger-api-document').config;
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// error handler
app.use(errorHandler);

app.get("/", (req, res)=>{
    res.send("Server is running")
})

// create roles if not already exist
function initial() {
    db.role
        .estimatedDocumentCount()
        .then((count) => {
            if (count === 0) {
                db.role
                    .insertMany([{ name: "user" }, { name: "admin" }])
                    .then(logger.info("Added roles"))
                    .catch((err) => logger.error(err));
            }
        })
        .catch((err) => logger.error(err));
}

async function setDefaultGcsStorageIfNotAlreadySetFromEnvVariable() {
    console.log('setDefaultGcsStorageIfNotAlreadySetFromEnvVariable ~ setDefaultGcsStorageIfNotAlreadySetFromEnvVariable:')

    const doesDefaultGCSCloudStorageExistInDB = await CloudStorageBucket.exists({isDefault: true});
    console.log('setDefaultGcsStorageIfNotAlreadySetFromEnvVariable ~ doesDefaultGCSCloudStorageExistInDB:', doesDefaultGCSCloudStorageExistInDB)
    if (doesDefaultGCSCloudStorageExistInDB) {
        hasSetDefaultGcsStorageFromEnvVariable = true;
        return;
    }

    const privateKey = appConfig.GCP_DATA_SECRET_PRIVATE_KEY;
    const encryptedGCPKeyData = encryptGcpDataHelper(
        appConfig.DEFAULT_GCP_BUCKET_CONNECTION_JSON_STRING,
        privateKey
    )

    let gcpDoc = new GCP({keyData: encryptedGCPKeyData});    

    const bucketName = `auto-ai-${generateNewObjectId()}`;
    console.log('setDefaultGcsStorageIfNotAlreadySetFromEnvVariable ~ bucketName:', bucketName)
    const GCPBucket = await createCloudStorageBucket(
        JSON.parse(appConfig.DEFAULT_GCP_BUCKET_CONNECTION_JSON_STRING),
        bucketName
      );

    gcpDoc = await gcpDoc.save();

    /** @type {CloudStorageBucketMongooseDocument} */
    let cloudStorageBucket = new CloudStorageBucket({
        name: bucketName,
        gcpId: gcpDoc._id,
        isDefault: true
    });    

    cloudStorageBucket = await cloudStorageBucket.save();

    hasSetDefaultGcsStorageFromEnvVariable = true;
    console.log("cloud storage bucket created")
}

// initial();

// db.mongoose.set("debug", true);

// setInterval(() => {
//     const used = process.memoryUsage().heapUsed / 1024 / 1024;
// console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
// }, 2000);

// comment