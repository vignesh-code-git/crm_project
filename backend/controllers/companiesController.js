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
    const { id } = req.params;
    const company = await repo.updateCompany(id, req.body);
    if (!company) return res.status(404).json({ error: "Company not found" });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "info",
      title: "Company Updated",
      message: `Company **${company.company_name}** has been updated by **${req.user.first_name}**.`,
      metadata: {
        target_name: company.company_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      },
      entity_type: "companies",
      entity_id: company.id
    });

    res.json(company);
  } catch (err) {
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

        for (const ownerId of ownersToNotify) {
          const isActingUser = Number(ownerId) === actingUserId;
          await notifRepo.createNotification({
            user_id: ownerId,
            type: "info",
            title: isActingUser ? "Company Unassigned" : "Owner Removed",
            message: isActingUser
              ? `You have been removed from Company **${company.company_name}**. The record still exists for other owners.`
              : `**${actorName}** was removed from Company **${company.company_name}**.`,
            metadata: {
              target_name: company.company_name,
              actor_name: actorName,
              entity_type: 'companies',
              entity_id: id
            }
          });
        }
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
        const unassignedNamesStr = result.unassignedNames?.join(", ") || "the selected companies";

        await notifRepo.createNotification({
          user_id: userId,
          type: "error", // 🔥 Redish color
          title: "Bulk Action Result",
          message: isActingUser
            ? `You have been removed from Companies: **${unassignedNamesStr}**. The records still exist for other owners.`
            : `**${req.user.first_name}** performed a bulk action. ${result.deleted > 0 ? `${result.deleted} companies were deleted, and ` : ""}was removed from: **${unassignedNamesStr}**.`,
          metadata: {
            actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim(),
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