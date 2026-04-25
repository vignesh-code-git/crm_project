// [controllers/ticketsController.js]
const repo = require("../repositories/ticketsRepository");
const usersRepo = require("../repositories/usersRepository");
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

    const isAdmin = req.user.role === "admin";
    const result = await repo.deleteTicket(id, req.user.id, isAdmin);

    if (result?.action === 'unassigned') {
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();
      const actingUserId = Number(req.user.id);

      if (Array.isArray(result.previousOwners)) {
        const ownersToNotify = new Set(result.previousOwners.map(Number));
        ownersToNotify.add(actingUserId);
        
        try {
          const adminIds = await usersRepo.getAdminIds();
          adminIds.forEach(id => ownersToNotify.add(Number(id)));
        } catch (err) {
          console.error("Failed to fetch admin IDs:", err);
        }

        for (const ownerId of ownersToNotify) {
          const isActingUser = Number(ownerId) === actingUserId;
          await notifRepo.createNotification({
            user_id: ownerId,
            type: "info",
            title: isActingUser ? "Ticket Unassigned" : "Owner Removed",
            message: isActingUser 
              ? `You have been removed from Ticket **${ticket.ticket_name}**. The record still exists for other owners.`
              : `**${actorName}** was removed from Ticket **${ticket.ticket_name}**.`,
            metadata: { 
              target_name: ticket.ticket_name, 
              actor_name: actorName,
              entity_type: 'tickets',
              entity_id: id
            }
          });
        }
      }
      return res.json({ message: `You have been removed from Ticket "${ticket.ticket_name}". The record still exists for other owners.`, action: 'unassigned' });
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
          title: "Ticket Deleted",
          message: `Ticket **${ticket.ticket_name}** has been deleted successfully by **${req.user.first_name}**.`,
          metadata: {
            target_name: ticket.ticket_name,
            actor_name: actorName,
            entity_type: 'tickets'
          }
        });
      }
    }

    res.json({ message: "Ticket deleted successfully" });
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
    const isAdmin = req.user.role === "admin";
    const result = await repo.deleteTicketsBulk(ids, req.user.id, isAdmin);

    if (result?.unassigned > 0 || result?.action === 'mixed') {
      const actingUserId = Number(req.user.id);
      const usersToNotify = new Set([actingUserId]);
      try {
        const adminIds = await usersRepo.getAdminIds();
        adminIds.forEach(id => usersToNotify.add(Number(id)));
      } catch (err) {
        console.error("Failed to fetch admin IDs:", err);
      }

      for (const userId of usersToNotify) {
        const isActingUser = Number(userId) === actingUserId;
        const unassignedNamesStr = result.unassignedNames?.join(", ") || "the selected tickets";

        await notifRepo.createNotification({
          user_id: userId,
          type: "error", // 🔥 Redish color
          title: "Bulk Action Result",
          message: isActingUser 
            ? `You have been removed from Tickets: **${unassignedNamesStr}**. The record(s) still exist for other owners.`
            : `**${req.user.first_name}** performed a bulk action. ${result.deleted} ticket(s) deleted, ${result.unassigned} unassigned.`,
          metadata: {
            actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim(),
            entity_type: 'tickets'
          }
        });
      }

      return res.json({ 
        action: 'mixed', 
        message: `You have been removed from Tickets: ${result.unassignedNames?.join(", ") || "the selected tickets"}. The record(s) still exist for other owners.`,
        deleted: result.deleted, 
        unassigned: result.unassigned 
      });
    }

    res.json({ message: `${result?.deleted || ids.length} tickets deleted successfully` });
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