const { Deal, User, sequelize } = require("../models");
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

const parseMultiOwners = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(Number).filter(id => !isNaN(id));
  if (typeof val === "string") {
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
async function getDeals() {
  const sql = `
    SELECT 
      d.*,
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      d.owner_id as owner_ids,
      l.phone AS lead_phone,
      TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name,
      c.company_name AS company_name
    FROM deals d
    LEFT JOIN users u ON u.id = ANY(d.owner_id)
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN companies c ON l.company_id = c.id
    GROUP BY d.id, l.id, c.id
    ORDER BY d.created_at DESC
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
}

// GET BY OWNER (Standard User View - Masked)
async function getDealsByOwner(ownerId) {
  const sql = `
    SELECT 
      d.*,
      (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = :ownerId) as owner_name,
      d.owner_id as owner_ids,
      l.phone AS lead_phone,
      CONCAT(l.first_name, ' ', l.last_name) AS lead_name,
      c.company_name AS company_name
    FROM deals d
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN companies c ON l.company_id = c.id
    WHERE :ownerId = ANY(d.owner_id)
    GROUP BY d.id, l.id, c.id
    ORDER BY d.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { ownerId: Number(ownerId) },
    type: QueryTypes.SELECT
  });
}

// GET BY ID (Enriched)
async function getDealById(id) {
  const sql = `
    SELECT 
      d.*,
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      d.owner_id as owner_ids,
      l.phone AS phone,
      l.email AS email,
      TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name,
      c.company_name AS company_name
    FROM deals d
    LEFT JOIN users u ON u.id = ANY(d.owner_id)
    LEFT JOIN leads l ON d.lead_id = l.id
    LEFT JOIN companies c ON l.company_id = c.id
    WHERE d.id = :id
    GROUP BY d.id, l.id, c.id
  `;
  const results = await sequelize.query(sql, {
    replacements: { id: Number(id) },
    type: QueryTypes.SELECT
  });

  if (results.length === 0) return null;
  const json = results[0];
  json.multi_owners = json.owner_id || [];
  return json;
}

// CREATE
async function createDeal(data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  const deal = await Deal.create({
    deal_name: toNull(data.deal_name),
    deal_stage: toNull(data.deal_stage),
    lead_id: toNull(data.lead_id),
    close_date: toNull(data.close_date),
    amount: toNull(data.amount) || 0,
    owner_id: owners,
    company_id: toNull(data.company_id),
    priority: toNull(data.priority) || 'Medium',
  });
  return deal.toJSON();
}

// UPDATE
async function updateDeal(id, data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  await Deal.update({
    deal_name: toNull(data.deal_name),
    deal_stage: toNull(data.deal_stage),
    lead_id: toNull(data.lead_id),
    close_date: toNull(data.close_date),
    amount: toNull(data.amount),
    owner_id: owners,
    company_id: toNull(data.company_id),
    priority: toNull(data.priority),
    updated_at: new Date(),
  }, {
    where: { id: toNull(id) }
  });

  const deal = await Deal.findByPk(id);
  return deal ? deal.toJSON() : null;
}

// DELETE
async function deleteDeal(id) {
  await deletePolymorphicActivities('deals', id);
  await Deal.destroy({ where: { id: toNull(id) } });
}

// CREATE BULK
async function createBulk(dataArray) {
  const dealsData = dataArray.map(data => {
    return {
      deal_name: toNull(data.deal_name),
      deal_stage: toNull(data.deal_stage),
      lead_id: toNull(data.lead_id),
      close_date: toNull(data.close_date),
      amount: toNull(data.amount) || 0,
      owner_id: parseMultiOwners(data.multi_owners || data.owner_id),
      company_id: toNull(data.company_id),
      priority: toNull(data.priority) || 'Medium'
    };
  });

  const createdDeals = await Deal.bulkCreate(dealsData, { returning: true });
  return createdDeals.map(d => d.toJSON());
}

// DELETE BULK
async function deleteDealsBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  await deletePolymorphicActivities('deals', ids);
  await Deal.destroy({ where: { id: ids } });
}

module.exports = {
  getDeals,
  getDealsByOwner,
  getDealById,
  createDeal,
  createBulk,
  updateDeal,
  deleteDeal,
  deleteDealsBulk,
};