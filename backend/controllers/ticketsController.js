// [controllers/ticketsController.js]
const repo = require("../repositories/ticketsRepository");
const notifRepo = require("../repositories/notificationsRepository");
const activityRepo = require("../repositories/activitiesRepository");

// CREATE
exports.createTicket = async (req, res) => {
  try {
    if (!req.body.ticket_name) {
      return res.status(400).json({ error: "ticket_name is required" });
    }

    if (req.user.role !== "admin") {
      req.body.owner_id = req.user.id;
    }

    const ticket = await repo.createTicket(req.body);

    // 🔥 ACTIVITY LOGGING
    const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();

    // Log for Ticket (Creation)
    await activityRepo.createActivity({
      user_id: req.user.id,
      type: "ticket_creation",
      action_text: `created ${ticket.ticket_name}`,
      related_id: ticket.id,
      related_type: "tickets",
      metadata: { entity_name: ticket.ticket_name }
    });

    // Log for Ticket (Initial Status)
    await activityRepo.createActivity({
      user_id: req.user.id,
      type: "status_change",
      action_text: `moved ticket to ${ticket.ticket_status.toLowerCase()}`,
      related_id: ticket.id,
      related_type: "tickets",
      metadata: {
        new_status: ticket.ticket_status,
        entity_name: ticket.ticket_name
      }
    });

    // Log for Company (if exists)
    if (ticket.company_id) {
      await activityRepo.createActivity({
        user_id: req.user.id,
        type: "ticket_creation",
        action_text: `created ${ticket.ticket_name}`,
        related_id: ticket.company_id,
        related_type: "companies",
        metadata: { entity_name: ticket.ticket_name, ticket_id: ticket.id }
      });
    }

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "success",
      title: "Ticket Created",
      message: `Ticket **${ticket.ticket_name}** was created successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: ticket.ticket_name,
        actor_name: actorName
      },
      entity_type: "tickets",
      entity_id: ticket.id
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET
exports.getTickets = async (req, res) => {
  try {
    let tickets;

    if (req.user.role === "admin") {
      tickets = await repo.getTickets();
    } else {
      tickets = await repo.getTicketsByOwner(req.user.id);
    }

    res.json(tickets);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
exports.getTicketById = async (req, res) => {
  try {
    const ticket = await repo.getTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });
    res.json(ticket);
  } catch (err) {
    console.error("FETCH ONE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const oldTicket = await repo.getTicketById(id);
    const ticket = await repo.updateTicket(id, req.body);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    // 🔥 ACTIVITY LOGGING (Status Change)
    if (req.body.ticket_status && oldTicket.ticket_status !== req.body.ticket_status) {
      const statusText = `moved ticket to ${ticket.ticket_status.toLowerCase()}`;

      // Log for Ticket
      await activityRepo.createActivity({
        user_id: req.user.id,
        type: "status_change",
        action_text: statusText,
        related_id: ticket.id,
        related_type: "tickets",
        metadata: {
          old_status: oldTicket.ticket_status,
          new_status: ticket.ticket_status,
          entity_name: ticket.ticket_name
        }
      });

      // Log for Company
      if (ticket.company_id) {
        await activityRepo.createActivity({
          user_id: req.user.id,
          type: "status_change",
          action_text: `moved ${ticket.ticket_name} to ${ticket.ticket_status.toLowerCase()}`,
          related_id: ticket.company_id,
          related_type: "companies",
          metadata: {
            old_status: oldTicket.ticket_status,
            new_status: ticket.ticket_status,
            entity_name: ticket.ticket_name,
            ticket_id: ticket.id
          }
        });
      }
    }

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "info",
      title: "Ticket Updated",
      message: `Ticket **${ticket.ticket_name}** has been updated by **${req.user.first_name}**.`,
      metadata: {
        target_name: ticket.ticket_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      },
      entity_type: "tickets",
      entity_id: ticket.id
    });

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await repo.getTicketById(id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    await repo.deleteTicket(id);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "error",
      title: "Ticket Deleted",
      message: `Ticket **${ticket.ticket_name}** has been deleted successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: ticket.ticket_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      }
    });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// BULK DELETE
exports.bulkDeleteTickets = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs array is required" });
    }
    await repo.deleteTicketsBulk(ids);
    res.json({ message: `${ids.length} tickets deleted successfully` });
  } catch (err) {
    console.error("BULK DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// BULK CREATE
exports.bulkCreateTickets = async (req, res) => {
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