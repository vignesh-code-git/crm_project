const repo = require("../repositories/notesRepository");
const notifRepo = require("../repositories/notificationsRepository");

// CREATE NOTE (was createActivity in old version)
exports.createNote = async (req, res) => {
  try {
    const { related_id, related_type, data, user_id } = req.body;

    // Object signature: { data, user_id, related_id, related_type }
    const result = await repo.createNote({ data, user_id, related_id, related_type });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user_id,
      type: "success",
      message: `A new note has been added to the ${related_type} by **${req.user?.first_name || "System"}**.`,
      metadata: { 
        actor_name: `${req.user?.first_name || ""} ${req.user?.last_name || ""}`.trim()
      },
      entity_type: "notes",
      entity_id: result.id
    });

    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET NOTES (was getActivities in old version)
exports.getNotes = async (req, res) => {
  try {
    const { related_id, related_type } = req.query;

    const rows = await repo.getNotes(related_id, related_type);

    res.json(rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPLOAD (Move the attachment logic here if needed, or keep in attachmentsController)
exports.uploadFile = async (req, res) => {
  try {
    const {
      attachment_type,
      attachment_id,
      related_id,
      related_type,
      user_id
    } = req.body;

    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `http://localhost:5000/uploads/${file.filename}`;

    const attachment = await repo.createAttachment({
      file,
      fileUrl,
      attachment_type,
      attachment_id,
      related_id,
      related_type,
      user_id
    });

    res.json({
      url: fileUrl,
      attachment: attachment
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};