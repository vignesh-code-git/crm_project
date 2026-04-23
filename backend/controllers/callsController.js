const repo = require("../repositories/callsRepository");
const notifRepo = require("../repositories/notificationsRepository");
const { makeCall } = require("../services/callsService");
const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.getCallStatus = async (req, res) => {
  try {
    const { sid } = req.params;
    if (!sid) return res.status(400).json({ error: "SID is required" });

    const call = await client.calls(sid).fetch();

    res.json({
      status: call.status, // queued, ringing, in-progress, completed, busy, no-answer, etc.
      duration: call.duration
    });
  } catch (err) {
    console.error("GET CALL STATUS ERROR:", err);
    res.status(500).json({ error: "Failed to fetch call status" });
  }
};

exports.terminateCall = async (req, res) => {
  try {
    const { sid } = req.params;
    if (!sid) return res.status(400).json({ error: "SID is required" });

    console.log(`⏹️ Terminating call: ${sid}`);
    
    // Update status to 'completed' to end the call
    await client.calls(sid).update({ status: 'completed' });

    res.json({ message: "Call terminated" });
  } catch (err) {
    console.error("TERMINATE CALL ERROR:", err);
    // Even if it fails (e.g. already ended), we return success to the UI
    res.json({ message: "Call end signal sent" });
  }
};

exports.initiateCall = async (req, res) => {
  try {
    const { phone, entityName } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    console.log(`📞 Starting real call to: ${phone} (${entityName || "Unknown"})`);

    const message = `Hello ${entityName || "there"}, this is a recorded call from your CRM system concerning your recent inquiry.`;
    
    const callResult = await makeCall(phone, message);

    res.json({
      message: "Call initiated successfully",
      sid: callResult.sid
    });
  } catch (err) {
    console.error("CALL INITIATION ERROR:", err);
    res.status(500).json({ error: "Failed to initiate call. Check Twilio settings." });
  }
};

exports.createCall = async (req, res) => {
  try {
    const { related_id, related_type, data, user_id } = req.body;
    // Object signature: { data, user_id, related_id, related_type }
    const result = await repo.createCall({ related_id, related_type, data, user_id });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user_id,
      type: "success",
      message: `A new call log has been added to the ${related_type} by **${req.user?.first_name || "System"}**.`,
      metadata: { 
        actor_name: `${req.user?.first_name || ""} ${req.user?.last_name || ""}`.trim()
      },
      entity_type: "calls",
      entity_id: result.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCalls = async (req, res) => {
  try {
    const { related_id, related_type } = req.query;
    const result = await repo.getCalls(related_id, related_type);
    res.json(result);
  } catch (err) {
    console.error("CALL GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
