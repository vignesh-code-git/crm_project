const { Company, User, Lead, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");
const { deletePolymorphicActivities } = require("./cascadeRepository");

// ==========================
// 🔥 HELPERS (ROBUST)
// ==========================
const toNull = (val) => {
  if (val === undefined || val === null || val === "" || String(val).toLowerCase() === "nan") {
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
async function getCompanies() {
  const sql = `
    SELECT 
      c.*,
      c.email AS email, -- 🔥 Explicitly select to avoid any join collisions
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      c.owner_id as owner_ids
    FROM companies c
    LEFT JOIN users u ON u.id = ANY(c.owner_id)
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
}

// GET BY OWNER (Standard User View - Masked)
async function getCompaniesByOwner(ownerId) {
  const sql = `
    SELECT 
      c.*, 
      c.email AS email, -- 🔥 Explicitly select to avoid any join collisions
      (SELECT CONCAT(first_name, ' ', last_name) FROM users WHERE id = :ownerId) as owner_name,
      c.owner_id as owner_ids
    FROM companies c
    WHERE :ownerId = ANY(c.owner_id)
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `;
  return await sequelize.query(sql, {
    replacements: { ownerId: Number(ownerId) },
    type: QueryTypes.SELECT
  });
}

// GET BY ID
async function getCompanyById(id) {
  const company = await Company.findByPk(id);
  if (!company) return null;
  const json = company.toJSON();
  json.multi_owners = json.owner_id || [];
  json.owner_ids = json.owner_id || [];
  return json;
}

// CREATE 
async function createCompany(data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  const company = await Company.create({
    company_name: toNull(data.company_name),
    domain_name: toNull(data.domain_name),
    industry: toNull(data.industry),
    type: toNull(data.type),
    city: toNull(data.city),
    country: toNull(data.country),
    phone: toNull(data.phone),
    email: toNull(data.email),
    no_of_employees: toNull(data.no_of_employees),
    annual_revenue: toNull(data.annual_revenue),
    owner_id: owners,
  });
  return company.toJSON();
}

// UPDATE
async function updateCompany(id, data) {
  const owners = parseMultiOwners(data.multi_owners || data.owner_id);
  await Company.update({
    company_name: toNull(data.company_name),
    domain_name: toNull(data.domain_name),
    industry: toNull(data.industry),
    type: toNull(data.type),
    city: toNull(data.city),
    country: toNull(data.country),
    phone: toNull(data.phone),
    email: toNull(data.email),
    no_of_employees: toNull(data.no_of_employees),
    annual_revenue: toNull(data.annual_revenue),
    owner_id: owners,
    updated_at: new Date(),
  }, {
    where: { id: toNull(id) }
  });

  const company = await Company.findByPk(id);
  return company ? company.toJSON() : null;
}

// DELETE
async function deleteCompany(id) {
  await deletePolymorphicActivities('companies', id);
  await Company.destroy({ where: { id: toNull(id) } });
}

// CREATE BULK
async function createBulk(dataArray) {
  const companiesData = dataArray.map(data => {
    return {
      company_name: toNull(data.company_name),
      domain_name: toNull(data.domain_name),
      industry: toNull(data.industry),
      type: toNull(data.type),
      city: toNull(data.city),
      country: toNull(data.country),
      phone: toNull(data.phone),
      email: toNull(data.email),
      no_of_employees: toNull(data.no_of_employees),
      annual_revenue: toNull(data.annual_revenue),
      owner_id: parseMultiOwners(data.multi_owners || data.owner_id),
    };
  });

  const createdCompanies = await Company.bulkCreate(companiesData, { returning: true });
  const ids = createdCompanies.map(c => c.id);

  // 🔥 REACH FOR ENRICHED DATA
  const sql = `
    SELECT 
      c.*,
      STRING_AGG(DISTINCT CONCAT(u.first_name, ' ', u.last_name), ', ') AS owner_name,
      c.owner_id as owner_ids,
      l.id AS lead_id,
      l.phone AS lead_phone,
      l.email AS lead_email,
      TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS lead_name
    FROM companies c
    LEFT JOIN users u ON u.id = ANY(c.owner_id)
    LEFT JOIN leads l ON l.company_id = c.id
    WHERE c.id = ANY(ARRAY[:ids]::INTEGER[])
    GROUP BY c.id, l.id
  `;
  return await sequelize.query(sql, { replacements: { ids }, type: QueryTypes.SELECT });
}

// DELETE BULK
async function deleteCompaniesBulk(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  await deletePolymorphicActivities('companies', ids);
  await Company.destroy({ where: { id: ids } });
}

module.exports = {
  getCompanies,
  getCompaniesByOwner,
  getCompanyById,
  createCompany,
  createBulk,
  updateCompany,
  deleteCompany,
  deleteCompaniesBulk,
};