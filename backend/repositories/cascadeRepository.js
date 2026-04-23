const { Note, Email, Call, Task, Meeting, Attachment } = require("../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");

/**
 * Automatically deletes all polymorphic activity records tied to a specific entity.
 * Also performs a "Deep Cascade" to remove attachments linked to sub-activities (Notes, Emails, etc.)
 * 
 * @param {string} type - 'leads', 'companies', 'deals', or 'tickets'
 * @param {number|number[]} ids - A single ID or an array of IDs
 */
async function deletePolymorphicActivities(type, ids) {
  const idArray = Array.isArray(ids) ? ids : [ids];
  
  if (!idArray || idArray.length === 0) return;

  const condition = {
    related_type: type,
    related_id: idArray
  };

  try {
    // 1. Fetch IDs of all related activities to find "Deep Linked" attachments
    const [notes, emails, calls, tasks, meetings] = await Promise.all([
      Note.findAll({ where: condition, attributes: ["id"] }),
      Email.findAll({ where: condition, attributes: ["id"] }),
      Call.findAll({ where: condition, attributes: ["id"] }),
      Task.findAll({ where: condition, attributes: ["id"] }),
      Meeting.findAll({ where: condition, attributes: ["id"] }),
    ]);

    const noteIds = notes.map(n => n.id).filter(id => id != null);
    const emailIds = emails.map(e => e.id).filter(id => id != null);
    const callIds = calls.map(c => c.id).filter(id => id != null);
    const taskIds = tasks.map(t => t.id).filter(id => id != null);
    const meetingIds = meetings.map(m => m.id).filter(id => id != null);

    // 2. Fetch ALL relevant attachments (Directly related OR Deep linked to activities)
    const orConditions = [condition];
    if (noteIds.length > 0) orConditions.push({ attachment_type: 'note', attachment_id: noteIds });
    if (emailIds.length > 0) orConditions.push({ attachment_type: 'email', attachment_id: emailIds });
    if (callIds.length > 0) orConditions.push({ attachment_type: 'call', attachment_id: callIds });
    if (taskIds.length > 0) orConditions.push({ attachment_type: 'task', attachment_id: taskIds });
    if (meetingIds.length > 0) orConditions.push({ attachment_type: 'meeting', attachment_id: meetingIds });

    const attachments = await Attachment.findAll({
      where: {
        [Op.or]: orConditions
      }
    });

    // 3. Delete physical files from disk
    for (const attachment of attachments) {
      if (attachment.file_url) {
        try {
          const fileName = path.basename(attachment.file_url.split('?')[0]); // Handle potential query params
          const filePath = path.join(__dirname, "..", "uploads", fileName);
          
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Deep cleanup: Physical file deleted: ${fileName}`);
          }
        } catch (fileErr) {
          console.error(`❌ Failed to delete physical file for attachment ${attachment.id}:`, fileErr);
        }
      }
    }

    // 4. Run all database deletions
    // We explicitly delete attachments found in step 2 to ensure deep links are gone
    const attachmentIdsToDelete = attachments.map(a => a.id);

    await Promise.all([
      Note.destroy({ where: condition }),
      Email.destroy({ where: condition }),
      Call.destroy({ where: condition }),
      Task.destroy({ where: condition }),
      Meeting.destroy({ where: condition }),
      Attachment.destroy({ 
        where: {
          [Op.or]: [
            { id: attachmentIdsToDelete },
            condition
          ]
        } 
      })
    ]);
    
    console.log(`✅ Deep Cascade: Removed all ${type} activities and ${attachments.length} attachments for IDs: ${idArray.join(", ")}`);

  } catch (err) {
    console.error("❌ Error during deep attachment cascade cleanup:", err);
  }
}

module.exports = {
  deletePolymorphicActivities
};
