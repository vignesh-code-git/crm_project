const { Ticket, User, sequelize } = require("../models");
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
async function getTickets() {
  const sql = `
    SELECT 
      t.*,
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      t.owner_id as owner_ids,
      c.company_name AS company_name,
      d.deal_name AS deal_name,
      COALESCE(l_deal.id, l_comp.id) AS lead_id,
      COALESCE(l_deal.phone, l_comp.phone) AS lead_phone,
      COALESCE(l_deal.email, l_comp.email) AS lead_email,
      TRIM(CONCAT(COALESCE(l_deal.first_name, l_comp.first_name), ' ', COALESCE(l_deal.last_name, l_comp.last_name))) AS lead_name
    FROM tickets t
    LEFT JOIN users u ON u.id = ANY(t.owner_id)
    LEFT JOIN companies c ON t.company_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id
    LEFT JOIN leads l_deal ON d.lead_id = l_deal.id
    LEFT JOIN leads l_comp ON l_comp.company_id = t.company_id AND t.deal_id IS NULL
    GROUP BY t.id, c.id, d.id, l_deal.id, l_comp.id
    ORDER BY t.created_at DESC
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
}

// GET BY OWNER (Standard User View - Masked)
async function getTicketsByOwner(ownerId) {
  const sql = `
    SELECT 
      t.*,
      (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = :ownerId) as owner_name,
      t.owner_id as owner_ids,
      c.company_name AS company_name,
      d.deal_name AS deal_name,
      COALESCE(l_deal.id, l_comp.id) AS lead_id,
      COALESCE(l_deal.phone, l_comp.phone) AS lead_phone,
      COALESCE(l_deal.email, l_comp.email) AS lead_email,
      TRIM(CONCAT(COALESCE(l_deal.first_name, l_comp.first_name), ' ', COALESCE(l_deal.last_name, l_comp.last_name))) AS lead_name
    FROM tickets t
    LEFT JOIN companies c ON t.company_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id
    LEFT JOIN leads l_deal ON d.lead_id = l_deal.id
    LEFT JOIN leads l_comp ON l_comp.company_id = t.company_id AND t.deal_id IS NULL
    WHERE :ownerId = ANY(t.owner_id)
    GROUP BY t.id, c.id, d.id, l_deal.id, l_comp.id
    ORDER BY t.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { ownerId: Number(ownerId) },
    type: QueryTypes.SELECT
  });
}

// GET BY ID (Enriched)
async function getTicketById(id) {
  const sql = `
    SELECT 
      t.*,
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      t.owner_id as owner_ids,
      c.company_name AS company_name,
      d.deal_name AS deal_name,
      COALESCE(l_deal.id, l_comp.id) AS lead_id,
      COALESCE(l_deal.phone, l_comp.phone) AS phone,
      COALESCE(l_deal.email, l_comp.email) AS email,
      TRIM(CONCAT(COALESCE(l_deal.first_name, l_comp.first_name), ' ', COALESCE(l_deal.last_name, l_comp.last_name))) AS lead_name
    FROM tickets t
    LEFT JOIN users u ON u.id = ANY(t.owner_id)
    LEFT JOIN companies c ON t.company_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id
    LEFT JOIN leads l_deal ON d.lead_id = l_deal.id
    LEFT JOIN leads l_comp ON l_comp.company_id = t.company_id AND t.deal_id IS NULL
    WHERE t.id = :id
    GROUP BY t.id, c.id, d.id, l_deal.id, l_comp.id
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
async function createTicket(data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  const ticket = await Ticket.create({
    ticket_name: toNull(data.ticket_name),
    description: toNull(data.description),
    ticket_status: toNull(data.ticket_status),
    source: toNull(data.source),
    priority: toNull(data.priority),
    company_id: toNull(data.company_id),
    deal_id: toNull(data.deal_id),
    owner_id: owners,
  });
  return ticket.toJSON();
}

// UPDATE
async function updateTicket(id, data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  await Ticket.update({
    ticket_name: toNull(data.ticket_name),
    description: toNull(data.description),
    ticket_status: toNull(data.ticket_status),
    source: toNull(data.source),
    priority: toNull(data.priority),
    company_id: toNull(data.company_id),
    deal_id: toNull(data.deal_id),
    owner_id: owners,
    updated_at: new Date(),
  }, {
    where: { id: toNull(id) }
  });

  const ticket = await Ticket.findByPk(id);
  return ticket ? ticket.toJSON() : null;
}

// DELETE
async function deleteTicket(id) {
  await deletePolymorphicActivities('tickets', id);
  await Ticket.destroy({ where: { id: toNull(id) } });
}

// CREATE BULK
async function createBulk(dataArray) {
  const ticketsData = dataArray.map((data) => {
    return {
      ticket_name: toNull(data.ticket_name),
      description: toNull(data.description),
      ticket_status: toNull(data.ticket_status),
      source: toNull(data.source),
      priority: toNull(data.priority),
      company_id: toNull(data.company_id),
      deal_id: toNull(data.deal_id),
      owner_id: parseMultiOwners(data.multi_owners || data.owner_id),
    };
  });

  const createdTickets = await Ticket.bulkCreate(ticketsData, { returning: true });
  const ids = createdTickets.map((t) => t.id);

  // 🔥 REACH FOR ENRICHED DATA
  const sql = `
    SELECT 
      t.*,
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      t.owner_id as owner_ids,
      c.company_name AS company_name,
      d.deal_name AS deal_name,
      COALESCE(l_deal.id, l_comp.id) AS lead_id,
      COALESCE(l_deal.phone, l_comp.phone) AS lead_phone,
      COALESCE(l_deal.email, l_comp.email) AS lead_email,
      TRIM(CONCAT(COALESCE(l_deal.first_name, l_comp.first_name), ' ', COALESCE(l_deal.last_name, l_comp.last_name))) AS lead_name
    FROM tickets t
    LEFT JOIN users u ON u.id = ANY(t.owner_id)
    LEFT JOIN companies c ON t.company_id = c.id
    LEFT JOIN deals d ON t.deal_id = d.id
    LEFT JOIN leads l_deal ON d.lead_id = l_deal.id
    LEFT JOIN leads l_comp ON l_comp.company_id = t.company_id AND t.deal_id IS NULL
    WHERE t.id = ANY(ARRAY[:ids]::INTEGER[])
    GROUP BY t.id, c.id, d.id, l_deal.id, l_comp.id
  `;
  return await sequelize.query(sql, { replacements: { ids }, type: QueryTypes.SELECT });
}

// DELETE BULK
async function deleteTicketsBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  await deletePolymorphicActivities('tickets', ids);
  await Ticket.destroy({ where: { id: ids } });
}

module.exports = {
  getTickets,
  getTicketsByOwner,
  getTicketById,
  createTicket,
  createBulk,
  updateTicket,
  deleteTicket,
  deleteTicketsBulk,
};