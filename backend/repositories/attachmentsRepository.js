const { Attachment, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

const toNull = (val) => {
  if (val === undefined || val === null || val === "" || String(val).toLowerCase() === "nan") {
    return null;
  }
  return val;
};

// CREATE ATTACHMENT
exports.createAttachment = async ({
  file,
  fileUrl,
  attachment_type,
  attachment_id,
  related_id,
  related_type,
  user_id
}) => {
  const attachment = await Attachment.create({
    file_name: file.originalname,
    file_url: fileUrl,
    file_type: file.mimetype.split("/")[0],
    file_size: file.size,
    mime_type: file.mimetype,
    attachment_type: toNull(attachment_type),
    attachment_id: toNull(attachment_id),
    related_id: toNull(related_id),
    related_type: toNull(related_type),
    uploaded_by: toNull(user_id),
  });

  return attachment.toJSON();
};

// GET ATTACHMENTS
exports.getAttachments = async (related_type, related_id) => {
  const attachments = await Attachment.findAll({
    where: {
      related_type: toNull(related_type),
      related_id: toNull(related_id),
    },
    order: [["uploaded_at", "DESC"]],
  });
  return attachments.map(a => a.toJSON());
};

// LINK ATTACHMENTS
exports.linkAttachments = async (attachmentIds, attachmentType, attachmentId) => {
  if (!attachmentIds || attachmentIds.length === 0) return;
  
  await Attachment.update({
    attachment_type: attachmentType,
    attachment_id: attachmentId,
  }, {
    where: {
      id: attachmentIds
    }
  });
};
