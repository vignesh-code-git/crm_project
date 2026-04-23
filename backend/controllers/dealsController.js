const repo = require("../repositories/dealsRepository");
const leadRepo = require("../repositories/leadsRepository"); // 🔥 ADD THIS
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
    const { id } = req.params;
    const oldDeal = await repo.getDealById(id);
    const deal = await repo.updateDeal(id, req.body);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    // 🔥 ACTIVITY LOGGING (Status Change)
    if (req.body.deal_stage && oldDeal.deal_stage !== req.body.deal_stage) {
      const statusText = `moved deal to ${deal.deal_stage.toLowerCase()}`;

      // Log for Deal
      await activityRepo.createActivity({
        user_id: req.user.id,
        type: "status_change",
        action_text: statusText,
        related_id: deal.id,
        related_type: "deals",
        metadata: {
          old_status: oldDeal.deal_stage,
          new_status: deal.deal_stage,
          entity_name: deal.deal_name
        }
      });
    }

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "info",
      title: "Deal Updated",
      message: `Deal **${deal.deal_name}** has been updated by **${req.user.first_name}**.`,
      metadata: {
        target_name: deal.deal_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      },
      entity_type: "deals",
      entity_id: deal.id
    });

    res.json(deal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const deal = await repo.getDealById(id);
    if (!deal) return res.status(404).json({ error: "Deal not found" });

    await repo.deleteDeal(id);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "error",
      title: "Deal Deleted",
      message: `Deal **${deal.deal_name}** has been deleted successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: deal.deal_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      }
    });

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
    await repo.deleteDealsBulk(ids);
    res.json({ message: `${ids.length} deals deleted successfully` });
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