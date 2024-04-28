// @ts-check

const logger = require("../../logger");
const axios = require("axios");

exports.slackGenericPostApi = async (req, res, next) => {
    try {
        /**
         * @typedef {{
         *  slackApiUrl: string,
         *  slackRequestBody: Object
         * }} RequestBody
         */

        /** @type {RequestBody} */
        const reqBody = req.body;
        logger.info(
            "exports.slackGenericPostApi= ~ reqBody " + JSON.stringify(reqBody)
        );

        // @ts-ignore
        axios
            .post(reqBody.slackApiUrl, { ...reqBody.slackRequestBody })
            .then((apiResponse) => {
                res.json(apiResponse);
            })
            .catch((apiResponse) => {
                logger.error(
                    "exports.slackGenericPostApi= ~ apiResponse " +
                        apiResponse.message
                );
                res.status(200).json(apiResponse.data);
            });
    } catch (error) {
        next(error);
    }
};
