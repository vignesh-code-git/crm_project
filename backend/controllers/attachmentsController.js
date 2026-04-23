const repo = require("../repositories/attachmentsRepository");

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

exports.getAttachments = async (req, res) => {
  try {
    const { related_type, related_id } = req.query;
    const result = await repo.getAttachments(related_type, related_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
