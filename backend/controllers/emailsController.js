const repo = require("../repositories/emailsRepository");
const notifRepo = require("../repositories/notificationsRepository");

exports.createEmail = async (req, res) => {
  try {
    const { related_id, related_type, data, user_id } = req.body;
    // Object signature: { data, user_id, related_id, related_type }
    const result = await repo.createEmail({ data, user_id, related_id, related_type });

    // 🔥 NOTIFICATION
    const target = data.recipients || data.to || "Unknown Recipient";
    await notifRepo.createNotification({
      user_id: user_id,
      type: "success",
      title: "Email sent successfully",
      message: `Email sent to **${target}** by **${req.user?.first_name || 'System'}**.`,
      metadata: { 
        target_name: target, 
        actor_name: `${req.user?.first_name || ''} ${req.user?.last_name || ''}`.trim(),
        subject: data.subject,
        body: data.body,
        target_tab: "email" // For smart navigation
      },
      entity_type: "emails",
      entity_id: result.id
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEmails = async (req, res) => {
  try {
    const { related_id, related_type } = req.query;
    const result = await repo.getEmails(related_id, related_type);
    res.json(result);
  } catch (err) {
    console.error("EMAIL GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
