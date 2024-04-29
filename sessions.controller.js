
const db = require("../models");
const Sessions = db.sessions;

/**
 * Create a new session.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the session is created.
 */
exports.createSessions = async (req, res, next) => {
  try {
    const sessionData = req.body;
    const session = new Sessions(sessionData);
    await session.save();
    res.status(201).json({
      message: "Session created successfully",
      session: session,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Get all sessions.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the sessions are retrieved.
 */
exports.getAllSessions = async (req, res, next) => {
  try {
    const sessions = await Sessions.find({});
    res.status(200).send(sessions);
  } catch (err) {
    console.log("Error while getting all sessions", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Update a session by ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the session is updated.
 */
exports.updateSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const result = await Sessions.updateOne({ _id: sessionId });
    res.status(200).send(result);
  } catch (err) {
    console.log("Error while getting all sessions", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Delete a session by ID.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A Promise that resolves when the session is deleted.
 */
exports.deleteSessionById = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    console.log('sessionId', sessionId);

    const result = await Sessions.findByIdAndDelete({ _id: sessionId });

    if (!result) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ message: "Session deleted successfully", deletedSession: result });
  } catch (error) {
    console.error("Error deleting session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
