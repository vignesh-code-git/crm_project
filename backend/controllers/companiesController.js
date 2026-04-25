// [controllers/companiesController.js]
const repo = require("../repositories/companiesRepository");
const usersRepo = require("../repositories/usersRepository");
const notifRepo = require("../repositories/notificationsRepository");

// CREATE
exports.createCompany = async (req, res) => {
  try {
    if (!req.body.company_name) {
      return res.status(400).json({ error: "company_name is required" });
    }

    if (req.user.role !== "admin") {
      req.body.owner_id = req.user.id;
    }

    const data = await repo.createCompany(req.body);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "success",
      title: "Company Created",
      message: `Company **${data.company_name}** was created successfully by **${req.user.first_name}**.`,
      metadata: {
        target_name: data.company_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      },
      entity_type: "companies",
      entity_id: data.id
    });

    res.status(201).json(data);
  } catch (err) {
    console.error("CREATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET
exports.getCompanies = async (req, res) => {
  try {
    let companies;

    if (req.user.role === "admin") {
      companies = await repo.getCompanies();
    } else {
      companies = await repo.getCompaniesByOwner(req.user.id);
    }

    res.json(companies);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET ONE
exports.getCompanyById = async (req, res) => {
  try {
    const company = await repo.getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ error: "Company not found" });
    res.json(company);
  } catch (err) {
    console.error("FETCH ONE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateCompany = async (req, res) => {
  try {
    const companyId = req.params.id;
    const previousData = await repo.getCompanyById(companyId);
    const data = await service.updateCompany(companyId, req.body);

    const changedFields = [];
    const changedValues = {};
    const fieldsToTrack = ['company_name', 'email', 'phone', 'industry', 'website', 'address', 'city', 'country'];
    
    fieldsToTrack.forEach(field => {
      if (req.body[field] !== undefined && String(req.body[field]) !== String(previousData[field])) {
        const fieldLabel = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        changedFields.push(`**${fieldLabel}**: **${req.body[field]}**`);
        changedValues[field] = req.body[field];
      }
    });

    if (changedFields.length > 0) {
      const companyName = data.company_name;
      const actorName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();

      await notifRepo.broadcastNotification({
        user_id: req.user.id,
        type: "info",
        title: "Company Edited",
        message: `**${companyName}** - Edited\n${changedFields.join("\n")}`,
        metadata: {
          target_name: companyName,
          actor_name: actorName,
          is_edit: true,
          changed_values: changedValues
        },
        entity_type: "companies",
        entity_id: data.id
      });
    }

    res.json(data);
  } catch (err) {
    console.error("FETCH ONE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await repo.getCompanyById(id);
    if (!company) return res.status(404).json({ error: "Company not found" });

    const isAdmin = req.user.role === "admin";
    const result = await repo.deleteCompany(id, req.user.id, isAdmin);

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

        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "info",
          title: "Company Unassigned",
          message: `**${actorName}** was removed from Company **${company.company_name}**.`,
          metadata: {
            target_name: company.company_name,
            actor_name: actorName,
            is_unassignment: true,
            entity_type: 'companies',
            entity_id: id
          }
        });
      }
      return res.json({ message: `You have been removed from Company "${company.company_name}". The record still exists for other owners.`, action: 'unassigned' });
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
          title: "Company Deleted",
          message: `Company **${company.company_name}** has been deleted successfully by **${req.user.first_name}**.`,
          metadata: {
            target_name: company.company_name,
            actor_name: actorName,
            entity_type: 'companies'
          }
        });
      }
    }

    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// BULK DELETE
exports.bulkDeleteCompanies = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: "IDs array is required" });
    }
    const isAdmin = req.user.role === "admin";
    const result = await repo.deleteCompaniesBulk(ids, req.user.id, isAdmin);

    if (result?.unassigned > 0 || result?.deleted > 0) {
      const unassignedNamesStr = result.unassignedNames?.join(", ") || "the selected companies";

      // 1. Notification for DELETIONS
      if (result.deleted > 0) {
        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "error",
          title: "Companies Deleted",
          message: `**${req.user.first_name}** deleted **${result.deleted}** companies.`,
          metadata: {
            actor_name: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            entity_type: 'companies',
            count: result.deleted
          }
        });
      }

      // 2. Notification for UNASSIGNMENTS
      if (result.unassigned > 0) {
        await notifRepo.broadcastNotification({
          user_id: req.user.id,
          type: "error",
          title: "Companies Unassigned",
          message: `**${req.user.first_name}** was removed from Companies: **${unassignedNamesStr}**.`,
          metadata: {
            actor_name: `${req.user.first_name} ${req.user.last_name || ""}`.trim(),
            entity_type: 'companies',
            is_unassignment: true
          }
        });
      }

      return res.json({
        action: 'mixed',
        message: `You have been removed from Companies: ${result.unassignedNames?.join(", ") || "the selected companies"}. The records still exist for other owners.`,
        deleted: result.deleted,
        unassigned: result.unassigned
      });
    }

    res.json({ message: `${result?.deleted || ids.length} companies deleted successfully` });
  } catch (err) {
    console.error("BULK DELETE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

// BULK CREATE
exports.bulkCreateCompanies = async (req, res) => {
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