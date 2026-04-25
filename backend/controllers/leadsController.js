// [controllers/leadsController.js]
const service = require("../services/leadsService");
const repo = require("../repositories/leadsRepository");
const usersRepo = require("../repositories/usersRepository");
const notifRepo = require("../repositories/notificationsRepository");

// GET
exports.getLeads = async (req, res) => {
  try {
    let data;
    if (req.user.role === "admin") {
      data = await service.getLeads();
    } else {
      data = await service.getLeadsByOwner(req.user.id);
    }
    res.json(data);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET BY ID
exports.getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[BACKEND DEBUG] Fetching Lead ID: ${id}`);

    // 🔥 Bypassing service layer because getLeadById is not exported there
    const data = await repo.getLeadById(id);
    console.log(`[BACKEND DEBUG] Result from DB for ID ${id}:`, data);

    if (!data) {
      console.log(`[BACKEND DEBUG] Lead ${id} not found, sending 404`);
      return res.status(404).json({ error: "Lead not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("[BACKEND DEBUG] FETCH ONE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// CREATE
exports.createLead = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      req.body.owner_id = req.user.id;
    }
    const data = await service.createLead(req.body);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "success",
      title: "Lead Created",
      message: `Lead **${data.first_name} ${data.last_name || ""}** was created successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: `${data.first_name} ${data.last_name || ""}`,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      },
      entity_type: "leads",
      entity_id: data.id
    });

    res.json(data);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// CONVERT
exports.convertLead = async (req, res) => {
  try {
    const data = await service.convertLead(req.params.id);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "success",
      message: `Lead has been successfully converted by **${req.user.first_name}**.`,
      metadata: {
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      },
      entity_type: "leads",
      entity_id: req.params.id
    });

    res.json(data);
  } catch (err) {
    console.error("CONVERT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// QUALIFIED
exports.getQualifiedLeads = async (req, res) => {
  try {
    const data = await service.getQualifiedLeads(req.user);
    console.log(`[DEBUG CONTROLLER] Sending ${data.length} qualified leads to client (User: ${req.user?.id})`);
    res.json(data);
  } catch (err) {
    console.error("QUALIFIED ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateLead = async (req, res) => {
  try {
    const leadId = req.params.id;
    const previousData = await repo.getLeadById(leadId);
    const data = await service.updateLead(leadId, req.body);

    // Identify changed fields
    const changedFields = [];
    const changedValues = {};
    const fieldsToTrack = ['first_name', 'last_name', 'email', 'phone', 'status', 'lead_source', 'lifecycle_stage', 'job_title'];
    
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(previousData[field])) {
        const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        changedFields.push(`**${fieldLabel}**: **${req.body[field]}**`);
        changedValues[field] = req.body[field];
      }
    });

    if (changedFields.length > 0) {
      const leadName = `${data.first_name} ${data.last_name || ""}`.trim();
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();

      await notifRepo.broadcastNotification({
        user_id: req.user.id,
        type: "info",
        title: "Lead Edited",
        message: `**${leadName}** - Edited\n${changedFields.join("\n")}`,
        metadata: {
          target_name: leadName,
          actor_name: actorName,
          is_edit: true,
          changed_values: changedValues
        },
        entity_type: "leads",
        entity_id: data.id
      });
    }

    res.json(data);
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await repo.getLeadById(id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });

    const leadName = `${lead.first_name} ${lead.last_name || ""}`.trim();
    const isAdmin = req.user.role === "admin";

    const result = await service.deleteLead(id, req.user.id, isAdmin);

    if (result?.action === 'unassigned') {
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();
      const actingUserId = Number(req.user.id);

      // Notify all previous owners AND all Admins
      if (Array.isArray(result.previousOwners)) {
        const ownersToNotify = new Set(result.previousOwners.map(Number));
        ownersToNotify.add(actingUserId);

        // Add all admins
        try {
          const adminIds = await usersRepo.getAdminIds();
          adminIds.forEach(id => ownersToNotify.add(Number(id)));
        } catch (err) {
          console.error("Failed to fetch admin IDs:", err);
        }

        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "info",
          title: "Lead Unassigned",
          message: `**${actorName}** was removed from Lead **${leadName}**.`,
          metadata: {
            target_name: leadName,
            actor_name: actorName,
            is_unassignment: true,
            entity_type: 'leads',
            entity_id: id
          }
        });
      }

      return res.json({
        message: `You have been removed from Lead "${leadName}". The record still exists for other owners.`,
        action: 'unassigned'
      });
    }

    // 🔥 NOTIFICATION (Broadcast to Actor + Admins)
    const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();
    await notifRepo.broadcastNotification({
      user_id: req.user.id,
      type: "error",
      title: "Lead Deleted",
      message: `Lead **${leadName}** has been deleted successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: leadName,
        actor_name: actorName,
        entity_type: 'leads'
      }
    });

    res.json({ message: "Lead deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// BULK DELETE
exports.bulkDeleteLeads = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs array is required" });
    }
    const isAdmin = req.user.role === "admin";
    const result = await service.deleteLeadsBulk(ids, req.user.id, isAdmin);

    if (result?.deleted > 0 || result?.unassigned > 0) {
      const unassignedNamesStr = result.unassignedNames?.join(", ") || "the selected leads";

      // 1. Notification for DELETIONS
      if (result.deleted > 0) {
        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "error",
          title: "Leads Deleted",
          message: `**${req.user.first_name}** deleted **${result.deleted}** leads.`,
          metadata: {
            actor_name: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            entity_type: 'leads',
            count: result.deleted
          }
        });
      }

      // 2. Notification for UNASSIGNMENTS
      if (result.unassigned > 0) {
        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "error",
          title: "Leads Unassigned",
          message: `**${req.user.first_name}** was removed from Leads: **${unassignedNamesStr}**.`,
          metadata: {
            actor_name: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            entity_type: 'leads',
            is_unassignment: true
          }
        });
      }

      return res.json({ 
        action: 'mixed', 
        message: `Bulk action completed. ${result.deleted} deleted, ${result.unassigned} unassigned.`,
        deleted: result.deleted, 
        unassigned: result.unassigned 
      });
    }

    res.json({ message: `${result?.deleted || ids.length} leads deleted successfully` });
  } catch (err) {
    console.error("BULK DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// BULK CREATE
exports.bulkCreateLeads = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const dataArray = req.body.map(item => ({
      ...item,
      owner_id: isAdmin ? (item.owner_id || req.user.id) : req.user.id
    }));

    const result = await service.createBulk(dataArray);
    res.status(201).json(result);
  } catch (err) {
    console.error("BULK CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};