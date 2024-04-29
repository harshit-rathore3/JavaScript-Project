const db = require("../models");

const Sessions = db.sessions;

exports.createSessions = async (req, res, next) => {
    try {
        const sessionsData = req.body;

        const session = new Sessions(sessionsData);
        await session.save();
        res.status(201).json({
            message: "session created successfully",
            session: session,
        });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getAllSessions = async (req,res,next) => {
    try {
        const result = await Sessions.find({})
        res.status(200).send(result)
    }
    catch(err){
        console.log("Error while getting all sessions",err)
        res.status(500).json({error:"Internal Server Error"})
    }
}
exports.updateSessionById = async (req,res,next) =>{
    try {
        const {sessionId} = req.body
        const result = await Sessions.updateOne({_id:sessionId})
        res.status(200).send(result)
    }
    catch(err){
        console.log("Error while getting all sessions",err)
        res.status(500).json({error:"Internal Server Error"})
    }
}
exports.deleteSessionById = async (req, res, next) => {
    
    try {

        const {sessionId} = req.body; 
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
}
