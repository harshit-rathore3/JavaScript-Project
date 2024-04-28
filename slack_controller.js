 
// @ts-check
import logger from "../../logger";
import axios from "axios";

/**
 * @typedef {{
 *   slackApiUrl: string,
 *   slackRequestBody: Object
 * }} RequestBody
 */

/**
 * @param {import('express').Request<{}, {}, RequestBody>} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const slackGenericPostApi = async (req, res, next) => {
  try {
    const reqBody = req.body;
    logger.info(`slackGenericPostApi ~ reqBody ${JSON.stringify(reqBody)}`);

    await axios
      .post(reqBody.slackApiUrl, { ...reqBody.slackRequestBody })
      .then((apiResponse) => {
        res.json(apiResponse);
      })
      .catch((apiResponse) => {
        logger.error(`slackGenericPostApi ~ apiResponse ${apiResponse.message}`);
        res.status(200).json(apiResponse.data);
      });
  } catch (error) {
    next(error);
  }
};
