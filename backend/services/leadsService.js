const repo = require("../repositories/leadsRepository");

// ==========================
// 🔥 ENUM NORMALIZER
// ==========================
const normalizeStatus = (status) => {
  if (!status) return "New";

  const map = {
    "New": "New",
    "Open": "Open",
    "In Progress": "In Progress",
    "Contacted": "Contacted",
    "Qualified": "Qualified",
    "Converted": "Converted",
    "Disqualified": "Disqualified",
  };

  return map[status] || "New";
};

// ==========================
// 👑 GET ALL (ADMIN)
// ==========================
async function getLeads() {
  return await repo.getLeads();
}

// ==========================
// 👤 GET BY OWNER (USER)
// ==========================
async function getLeadsByOwner(userId) {
  return await repo.getLeadsByOwner(userId);
}

// ==========================
// CREATE
// ==========================
async function createLead(data) {
  data.lead_status = normalizeStatus(data.lead_status);

  return await repo.createLead(data);
}

// ==========================
// CONVERT (ONLY QUALIFIED)
// ==========================
async function convertLead(id) {
  const check = await repo.getLeadById(id);

  if (!check) throw new Error("Lead not found");

  if (check.lead_status !== "Qualified") {
    throw new Error("Only Qualified leads can be converted");
  }

  await repo.convertLead(id);

  return { message: "Lead converted successfully" };
}

// ==========================
// UPDATE
// ==========================
async function updateLead(id, data) {
  const check = await repo.getLeadById(id);

  if (!check) throw new Error("Lead not found");


  data.lead_status = normalizeStatus(data.lead_status);

  return await repo.updateLead(id, data);
}

// ==========================
// DELETE
// ==========================
async function deleteLead(id) {
  await repo.deleteLead(id);
  return { message: "Lead deleted" };
}

// ==========================
// QUALIFIED (CONVERTED LIST)
// ==========================
async function getQualifiedLeads(user) {
  return await repo.getQualifiedLeads(user?.id, user?.role === "admin");
}

// ==========================
// 📄 GET BY ID
// ==========================
async function getLeadById(id) {
  return await repo.getLeadById(id);
}

// BULK CREATE
async function createBulk(dataArray) {
  return await repo.createBulk(dataArray);
}

// ==========================
// DELETE BULK
// ==========================
async function deleteLeadsBulk(ids) {
  return await repo.deleteLeadsBulk(ids);
}

// ==========================
// EXPORT
// ==========================
module.exports = {
  getLeads,
  getLeadsByOwner,
  getLeadById,
  createLead,
  createBulk,
  convertLead,
  updateLead,
  deleteLead,
  deleteLeadsBulk,
  getQualifiedLeads,
};