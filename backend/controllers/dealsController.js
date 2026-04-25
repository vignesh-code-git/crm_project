const repo = require("../repositories/dealsRepository");
const leadRepo = require("../repositories/leadsRepository");
const usersRepo = require("../repositories/usersRepository");
const notifRepo = require("../repositories/notificationsRepository");
const activityRepo = require("../repositories/activitiesRepository");

// CREATE
exports.createDeal = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      req.body.owner_id = req.user.id;
    }

    const deal = await repo.createDeal(req.body);

    // 🔥 AUTOMATIC LEAD CONVERSION
    if (req.body.lead_id) {
      try {
        await leadRepo.convertLead(req.body.lead_id);
        console.log(`✅ Lead ${req.body.lead_id} automatically converted via Deal creation.`);
      } catch (convErr) {
        console.error("Secondary Lead Conversion Error:", convErr);
        // We don't fail the whole request if conversion fails, but it's good to log it.
      }
    }

    // 🔥 ACTIVITY LOGGING
    const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();

    // Log for Deal (Creation)
    await activityRepo.createActivity({
      user_id: req.user.id,
      type: "deal_creation",
      action_text: `created ${deal.deal_name}`,
      related_id: deal.id,
      related_type: "deals",
      metadata: { entity_name: deal.deal_name }
    });

    // Log for Deal (Initial Stage)
    await activityRepo.createActivity({
      user_id: req.user.id,
      type: "status_change",
      action_text: `moved deal to ${deal.deal_stage.toLowerCase()}`,
      related_id: deal.id,
      related_type: "deals",
      metadata: {
        new_status: deal.deal_stage,
        entity_name: deal.deal_name
      }
    });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "success",
      title: "Deal Created",
      message: `Deal **${deal.deal_name}** was created successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: deal.deal_name,
        actor_name: actorName
      },
      entity_type: "deals",
      entity_id: deal.id
    });

    res.status(201).json(deal);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET
exports.getDeals = async (req, res) => {
  try {
    let deals;

    if (req.user.role === "admin") {
      deals = await repo.getDeals();
    } else {
      deals = await repo.getDealsByOwner(req.user.id);
    }

    res.json(deals);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET BY ID
exports.getDealById = async (req, res) => {
  try {
    const deal = await repo.getDealById(req.params.id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });
    res.json(deal);
  } catch (err) {
    console.error("FETCH ONE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateDeal = async (req, res) => {
  try {
    const dealId = req.params.id;
    const previousData = await repo.getDealById(dealId);
    const data = await repo.updateDeal(dealId, req.body);
    if (!data) return res.status(404).json({ error: "Deal not found" });

    // 🔥 ACTIVITY LOGGING (Status Change)
    if (req.body.deal_stage && previousData.deal_stage !== req.body.deal_stage) {
      const statusText = `moved deal to ${data.deal_stage.toLowerCase()}`;

      // Log for Deal
      await activityRepo.createActivity({
        user_id: req.user.id,
        type: "status_change",
        action_text: statusText,
        related_id: data.id,
        related_type: "deals",
        metadata: {
          old_status: previousData.deal_stage,
          new_status: data.deal_stage,
          entity_name: data.deal_name
        }
      });
    }

    const changedFields = [];
    const changedValues = {};
    const fieldsToTrack = ['deal_name', 'deal_value', 'deal_stage', 'close_date', 'deal_description', 'deal_type', 'priority'];
    
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(previousData[field])) {
        const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        changedFields.push(`**${fieldLabel}**: **${req.body[field]}**`);
        changedValues[field] = req.body[field];
      }
    });

    if (changedFields.length > 0) {
      const dealName = data.deal_name;
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();

      await notifRepo.broadcastNotification({
        user_id: req.user.id,
        type: "info",
        title: "Deal Edited",
        message: `**${dealName}** - Edited\n${changedFields.join("\n")}`,
        metadata: {
          target_name: dealName,
          actor_name: actorName,
          is_edit: true,
          changed_values: changedValues
        },
        entity_type: "deals",
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
exports.deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await repo.getDealById(id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    const isAdmin = req.user.role === "admin";
    const result = await repo.deleteDeal(id, req.user.id, isAdmin);

    if (result?.action === 'unassigned') {
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();

      await notifRepo.broadcastNotification({
        user_id: req.user.id,
        type: "info",
        title: "Deal Unassigned",
        message: `**${actorName}** was removed from Deal **${deal.deal_name}**.`,
        metadata: {
          target_name: deal.deal_name,
          actor_name: actorName,
          is_unassignment: true,
          entity_type: 'deals',
          entity_id: id
        }
      });
      
      return res.json({ message: `You have been removed from Deal "${deal.deal_name}". The record still exists for other owners.`, action: 'unassigned' });
    }

    // 🔥 NOTIFICATION (Full delete - Notify all previous owners AND Admins)
    if (Array.isArray(result.previousOwners)) {
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();
      const actingUserId = Number(req.user.id);
      const ownersToNotify = new Set(result.previousOwners.map(Number));
      ownersToNotify.add(actingUserId);

      try {
        const adminIds = await usersRepo.getAdminIds();
        adminIds.forEach(id => ownersToNotify.add(Number(id)));
      } catch (err) {
        console.error("Failed to fetch admin IDs:", err);
      }

      for (const ownerId of ownersToNotify) {
        await notifRepo.createNotification({
          user_id: ownerId,
          type: "error",
          title: "Deal Deleted",
          message: `Deal **${deal.deal_name}** has been deleted successfully by **${req.user.first_name}**.`,
          metadata: {
            target_name: deal.deal_name,
            actor_name: actorName,
            entity_type: 'deals'
          }
        });
      }
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// BULK DELETE
exports.bulkDeleteDeals = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs array is required" });
    }
    const isAdmin = req.user.role === "admin";
    const result = await repo.deleteDealsBulk(ids, req.user.id, isAdmin);

    if (result?.unassigned > 0 || result?.action === 'mixed') {
      const unassignedNamesStr = result.unassignedNames?.join(", ") || "the selected deals";

      // 1. Notification for DELETIONS
      if (result.deleted > 0) {
        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "error",
          title: "Deals Deleted",
          message: `**${req.user.first_name}** deleted **${result.deleted}** deals.`,
          metadata: {
            actor_name: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            entity_type: 'deals',
            count: result.deleted
          }
        });
      }

      // 2. Notification for UNASSIGNMENTS
      if (result.unassigned > 0) {
        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "error",
          title: "Deals Unassigned",
          message: `**${req.user.first_name}** was removed from Deals: **${unassignedNamesStr}**.`,
          metadata: {
            actor_name: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            entity_type: 'deals',
            is_unassignment: true
          }
        });
      }

      return res.json({
        action: 'mixed',
        message: `You have been removed from Deals: ${result.unassignedNames?.join(", ") || "the selected deals"}. The records still exist for other owners.`,
        deleted: result.deleted,
        unassigned: result.unassigned
      });
    }

    res.json({ message: `${result?.deleted || ids.length} deals deleted successfully` });
  } catch (err) {
    console.error("BULK DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// BULK CREATE
exports.bulkCreateDeals = async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const dataArray = req.body.map(item => ({
      ...item,
      owner_id: isAdmin ? (item.owner_id || req.user.id) : req.user.id
    }));

    const result = await repo.createBulk(dataArray);
    res.status(201).json(result);
  } catch (err) {
    console.error("BULK CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};