
const logger = require("../../logger");
const os = require("os");

const db = require("../models");
const CoPilotResource = db.coPilotResource;
const Resource = db.resource;

/**
 * Get the current memory usage of the script.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends the memory usage in MB.
 */
exports.getCpuUtilization = async (req, res, next) => {
    try {
        const memoryUsedInMB = process.memoryUsage().heapUsed / 1024 / 1024;
        logger.info(`The script uses approximately ${Math.round(memoryUsedInMB * 100) / 100} MB`);
        res.send({ memoryUsedInMB });
    } catch (error) {
        next(error);
    }
};

/**
 * Get the total number of CPUs available on the system.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends the total number of CPUs.
 */
exports.getTotalCPUCount = async (req, res, next) => {
    try {
        const totalCPUs = os.cpus().length;
        res.send({ totalCPUs });
    } catch (error) {
        next(error);
    }
};

/**
 * Check if the server is alive.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends a response indicating that the server is alive.
 */
exports.isAliveStatusCheck = async (req, res, next) => {
    return res.send({ isAlive: true });
};

/**
 * Get the count of resources and co-pilot resources that are eligible for deletion.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - Sends the count of resources and co-pilot resources eligible for deletion.
 */
exports.getResourcesCountThoseAreEligibleForDeletion = async (req, res, next) => {
    try {
        const status = 'deleted';

        const resourcesCountPromise = new Promise(async (resolve, reject) => {
            const result = await Resource.aggregate([
                {
                    $match: {
                        status: status
                    }
                },
                {
                    $addFields: {
                        noOfdays: {
                            $trunc: {
                                $divide: [{ $subtract: [new Date(), '$statusLastModifiedAt'] }, 1000 * 60 * 60 * 24]
                            }
                        }
                    }
                },
                {
                    $match: {
                        noOfdays: { $gte: 30 }
                    }
                },
                {
                    $count: "totalCount"
                }
            ]);
            resolve(result?.[0]);
        });

        const coPilotResourcesCountPromise = new Promise(async (resolve, reject) => {
            const result = await CoPilotResource.aggregate([
                {
                    $addFields: {
                        noOfdays: {
                            $trunc: {
                                $divide: [{ $subtract: [new Date(), '$created_at'] }, 1000 * 60 * 60 * 24]
                            }
                        }
                    }
                },
                {
                    $match: {
                        noOfdays: { $gte: 7 }
                    }
                },
                {
                    $count: "totalCount"
                }
            ]);
            resolve(result?.[0]);
        });

        const counts = await Promise.all([resourcesCountPromise, coPilotResourcesCountPromise]);

        const response = { resourcesTotalCount: counts[0]?.totalCount ?? 0, coPilotResourcesTotalCount: counts[1]?.totalCount ?? 0 };

        res.send(response);
    } catch (error) {
        next(error);
    }
};
