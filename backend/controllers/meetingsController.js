const repo = require("../repositories/meetingsRepository");
const notifRepo = require("../repositories/notificationsRepository");

exports.createMeeting = async (req, res) => {
  try {
    const { related_id, related_type, data, user_id } = req.body;
    // Object signature: { data, user_id, related_id, related_type }
    const result = await repo.createMeeting({ data, user_id, related_id, related_type });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user_id,
      type: "success",
      title: "Meeting scheduled successfully",
      message: `Meeting scheduled to **${data.title || 'Vignesh'}** successfully by **${req.user?.first_name || "System"}**.`,
      metadata: { 
        target_name: data.title || 'Vignesh',
        actor_name: `${req.user?.first_name || ""} ${req.user?.last_name || ""}`.trim(),
        target_tab: "meeting" 
      },
      entity_type: "meetings",
      entity_id: result.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMeetings = async (req, res) => {
  try {
    const { related_id, related_type } = req.query;
    const result = await repo.getMeetings(related_id, related_type);
    res.json(result);
  } catch (err) {
    console.error("MEETING GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
