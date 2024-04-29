
const db = require("../models");
const { model: Model, resource: Resource } = db;
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

    const { type } = req.body;
    const { image_data: ids } = req.body;

    const modelResult = await Model.findOne({ name: type }, { _id: 0, headers: 1 });
    const headers = [modelResult.headers];

    const csvRecords = await Resource.find({ _id: { $in: ids } }, { _id: 0, csv: 1 });
    const rows = csvRecords.map((record) => record.csv);

    const filePath = await writeToCSVFile(headers, rows);
    res.status(200).send({ filePath });
  } catch (error) {
    next(error);
  }
};
