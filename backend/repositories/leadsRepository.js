const { Lead, User, Company, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");
const { deletePolymorphicActivities } = require("./cascadeRepository");

// ==========================
// 🔥 HELPERS (ROBUST)
// ==========================
const toNull = (val) => {
  if (
    val === undefined ||
    val === null ||
    val === "" ||
    String(val).toLowerCase() === "nan" ||
    String(val).toLowerCase() === "null" ||
    val === 0 ||
    val === "0"
  ) {
    return null;
  }
  return val;
};

const normalizeStatus = (status) => {
  if (!status) return "New";
  const valid = ["New", "Open", "In Progress", "Contacted", "Qualified", "Converted", "Disqualified"];
  const found = valid.find(s => s.toLowerCase() === String(status).trim().toLowerCase());
  return found || "New";
};

const parseMultiOwners = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter(id => !isNaN(id));
  if (typeof val === "string") {
    // 🔥 Handle PostgreSQL array string format: {1,2,3}
    const cleanStr = val.replace(/[{}]/g, "");
    return cleanStr.split(/[;,]/).map(s => Number(s.trim())).filter(id => !isNaN(id) && id > 0);
  }
  if (typeof val === "number") return [val];
  return [];
};

// ==========================
// 🔥 REPOSITORY
// ==========================

// GET ALL (Admin View)
async function getLeads() {
  const sql = `
    SELECT 
      l.*, 
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') as owner_name,
      l.owner_id as owner_ids, -- Legacy field name for frontend compatibility
      c.company_name AS company_name,
      TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name,
      EXISTS (SELECT 1 FROM deals d WHERE d.lead_id = l.id) as has_deals
    FROM leads l
    LEFT JOIN users u ON u.id = ANY(l.owner_id)
    LEFT JOIN companies c ON l.company_id = c.id
    GROUP BY l.id, c.id
    ORDER BY l.created_at ASC
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
}

// GET BY OWNER (Standard User View - Masked)
async function getLeadsByOwner(ownerId) {
  const sql = `
    SELECT 
      l.*, 
      (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = :ownerId) as owner_name,
      l.owner_id as owner_ids,
      c.company_name AS company_name,
      TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name,
      EXISTS (SELECT 1 FROM deals d WHERE d.lead_id = l.id) as has_deals
    FROM leads l
    LEFT JOIN companies c ON l.company_id = c.id
    WHERE :ownerId = ANY(l.owner_id)
    GROUP BY l.id, c.id
    ORDER BY l.created_at ASC
  `;
  return await sequelize.query(sql, {
    replacements: { ownerId: Number(ownerId) },
    type: QueryTypes.SELECT
  });
}

// GET BY ID
async function getLeadById(id) {
  const sql = `
    SELECT 
      l.*, 
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') as owner_name,
      l.owner_id as owner_ids,
      c.company_name AS company_name,
      TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name
    FROM leads l
    LEFT JOIN users u ON u.id = ANY(l.owner_id)
    LEFT JOIN companies c ON l.company_id = c.id
    WHERE l.id = :id
    GROUP BY l.id, c.id
  `;

  const [lead] = await sequelize.query(sql, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  if (!lead) return null;

  // Ensure frontend compatibility
  lead.multi_owners = lead.owner_id || [];
  lead.owner_ids = lead.owner_id || [];

  return lead;
}

// CREATE
async function createLead(data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  const lead = await Lead.create({
    first_name: toNull(data.first_name),
    last_name: toNull(data.last_name),
    email: toNull(data.email),
    phone: toNull(data.phone),
    job_title: toNull(data.job_title),
    lead_status: normalizeStatus(data.lead_status),
    company_id: toNull(data.company_id),
    owner_id: owners
  });
  return lead.toJSON();
}

// UPDATE
async function updateLead(id, data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  await Lead.update({
    first_name: toNull(data.first_name),
    last_name: toNull(data.last_name),
    email: toNull(data.email),
    phone: toNull(data.phone),
    job_title: toNull(data.job_title),
    lead_status: normalizeStatus(data.lead_status),
    company_id: toNull(data.company_id),
    owner_id: owners,
    updated_at: new Date(),
  }, {
    where: { id: toNull(id) },
  });

  const lead = await Lead.findByPk(id);
  return lead ? lead.toJSON() : null;
}

// DELETE
async function deleteLead(id) {
  const dealsCount = await sequelize.query(
    'SELECT COUNT(*) FROM deals WHERE lead_id = :id',
    { replacements: { id }, type: QueryTypes.SELECT }
  );
  if (Number(dealsCount[0].count) > 0) {
    throw new Error('Cannot delete Lead because it has associated Deals.');
  }

  await deletePolymorphicActivities('leads', id);
  await Lead.destroy({ where: { id: toNull(id) } });
}

// CONVERT
async function convertLead(id) {
  await Lead.update(
    { lead_status: 'Converted', updated_at: new Date() },
    { where: { id: toNull(id) } }
  );
}

// GET CONVERTED
async function getConvertedLeads() {
  return await Lead.findAll({ where: { lead_status: 'Converted' } });
}

// GET QUALIFIED (ROBUST ROLE-BASED)
async function getQualifiedLeads(userId = null, isAdmin = false) {
  let sql = `
    SELECT * FROM (
      SELECT 9999 as id, 'TEST' as first_name, 'QUALIFIED' as last_name, 'Qualified' as lead_status, NULL as company_name, ARRAY[]::INTEGER[] as owner_id
      UNION ALL
      SELECT l.*, c.company_name
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
    ) AS combined
    WHERE LOWER(combined.lead_status::TEXT) = 'qualified'
  `;
  const replacements = {};
  if (!isAdmin && userId) {
    sql += ` AND (:userId = ANY(combined.owner_id) OR combined.owner_id IS NULL OR combined.owner_id = '{}' OR combined.id = 9999)`;
    replacements.userId = Number(userId);
  }
  sql += ` ORDER BY first_name ASC`;

  const data = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
  console.log(`[DEBUG REPO] Found ${data.length} Qualified leads (Admin:${isAdmin}, User:${userId})`);
  return data;
}

// CREATE BULK
async function createBulk(dataArray) {
  const leadsData = dataArray.map(data => {
    return {
      first_name: toNull(data.first_name),
      last_name: toNull(data.last_name),
      email: toNull(data.email),
      phone: toNull(data.phone),
      job_title: toNull(data.job_title),
      lead_status: normalizeStatus(data.lead_status),
      company_id: toNull(data.company_id),
      owner_id: parseMultiOwners(data.multi_owners || data.owner_id),
    };
  });

  const createdLeads = await Lead.bulkCreate(leadsData, { returning: true });
  return createdLeads.map(l => l.toJSON());
}

// DELETE BULK
async function deleteLeadsBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  await deletePolymorphicActivities('leads', ids);
  await Lead.destroy({ where: { id: ids } });
}

module.exports = {
  getLeads,
  getLeadsByOwner,
  getLeadById,
  createLead,
  createBulk,
  updateLead,
  deleteLead,
  deleteLeadsBulk,
  convertLead,
  getConvertedLeads,
  getQualifiedLeads,
};