const db = require("../models");
const Model = db.model;
const Resource = db.resource;

const writeToCSVFile = require("../middlewares/csvOperator");

exports.downloadCSV = async (req, res, next) => {
    try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 400,
                    message: "Bad Request",
                    errors: errors.array(),
                });
            }
    
            const type = req.body.type;
            const ids = req.body.image_data;
    
            const result = await Model.findOne(
                { name: type },
                { _id: 0, headers: 1 }
            );
            const headers = [result.headers];
    
            const csvs = await Resource.find(
                { _id: { $in: ids } },
                { _id: 0, csv: 1 }
            );
            const rows = csvs.map((record) => record.csv);
    
            const filepath = await writeToCSVFile(headers, rows);
            res.status(200).send({ filepath: filepath });
    } catch (error) {
        next(error);
    }
};
