// [controllers/companiesController.js]
const repo = require("../repositories/companiesRepository");
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

    await repo.deleteCompany(id);

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: req.user.id,
      type: "error",
      title: "Company Deleted",
      message: `Company **${company.company_name}** has been deleted successfully by **${req.user.first_name}**.`,
      metadata: { 
        target_name: company.company_name,
        actor_name: `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim()
      }
    });

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
    await repo.deleteCompaniesBulk(ids);
    res.json({ message: `${ids.length} companies deleted successfully` });
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