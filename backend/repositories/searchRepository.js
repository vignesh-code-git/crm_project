const { QueryTypes } = require("sequelize");
const { sequelize } = require("../models");

/**
 * Perform high-fidelity global search with rich metadata and grouping
 */
async function globalSearch(term, userId, role) {
  let searchTerm = term.trim();
  let filterType = null;

  const prefixes = {
    "note:": "note", "email:": "email", "call:": "call",
    "meeting:": "meeting", "task:": "task", "lead:": "lead",
    "company:": "company", "deal:": "deal", "ticket:": "ticket"
  };

  const standaloneKeywords = {
    "notes": "note", "note": "note",
    "emails": "email", "email": "email",
    "calls": "call", "call": "call",
    "meetings": "meeting", "meeting": "meeting",
    "tasks": "task", "task": "task",
    "leads": "lead", "lead": "lead",
    "companies": "company", "company": "company",
    "deals": "deal", "deal": "deal",
    "tickets": "ticket", "ticket": "ticket"
  };

  if (standaloneKeywords[searchTerm.toLowerCase()]) {
    filterType = standaloneKeywords[searchTerm.toLowerCase()];
    searchTerm = "";
  } else {
    for (const [prefix, type] of Object.entries(prefixes)) {
      if (searchTerm.toLowerCase().startsWith(prefix)) {
        filterType = type;
        searchTerm = searchTerm.slice(prefix.length).trim();
        break;
      }
    }
  }

  if (searchTerm.length < 2 && !(filterType && searchTerm === "")) return [];
  const dbSearchTerm = `%${searchTerm}%`;

  const options = {
    replacements: { searchTerm: dbSearchTerm, role, userId },
    type: QueryTypes.SELECT,
  };

  const queries = [];

  // LEADS
  if (!filterType || filterType === 'lead') {
    queries.push(sequelize.query(`
      SELECT l.id, TRIM(CONCAT(l.first_name, ' ', l.last_name)) AS name, l.email, 'lead' as type, l.lead_status as status,
             l.phone, c.city, c.country, TRIM(CONCAT(l.first_name, ' ', l.last_name)) as relationship_name,
             l.id as parent_id, 'lead' as parent_type, TRIM(CONCAT(l.first_name, ' ', l.last_name)) as parent_name,
             TRIM(CONCAT(u.first_name, ' ', u.last_name)) as owner_name, c.company_name, l.job_title
      FROM leads l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN users u ON u.id = l.owner_id[1]
      WHERE (l.first_name ILIKE :searchTerm OR l.last_name ILIKE :searchTerm OR l.email ILIKE :searchTerm OR c.company_name ILIKE :searchTerm)
      AND (:role = 'admin' OR :userId = ANY(l.owner_id)) ORDER BY l.id DESC LIMIT 10
    `, options));
  }

  // COMPANIES
  if (!filterType || filterType === 'company') {
    queries.push(sequelize.query(`
      SELECT DISTINCT ON (c.id) c.id, c.company_name AS name, c.email, 'company' as type, c.industry as status,
             c.phone, c.city, c.country, c.domain_name as website, TRIM(CONCAT(l.first_name, ' ', l.last_name)) as relationship_name,
             c.id as parent_id, 'company' as parent_type, c.company_name as parent_name,
             TRIM(CONCAT(u.first_name, ' ', u.last_name)) as owner_name
      FROM companies c
      LEFT JOIN leads l ON l.company_id = c.id
      LEFT JOIN users u ON u.id = c.owner_id[1]
      WHERE (c.company_name ILIKE :searchTerm OR l.first_name ILIKE :searchTerm OR l.last_name ILIKE :searchTerm)
      AND (:role = 'admin' OR :userId = ANY(c.owner_id)) ORDER BY c.id DESC LIMIT 10
    `, options));
  }

  // DEALS
  if (!filterType || filterType === 'deal') {
    queries.push(sequelize.query(`
      SELECT d.id, d.deal_name AS name, NULL as email, 'deal' as type, d.deal_stage as status,
             d.amount, d.close_date, TRIM(CONCAT(lead_p.first_name, ' ', lead_p.last_name)) as relationship_name,
             COALESCE(d.company_id, d.lead_id) as parent_id, CASE WHEN d.company_id IS NOT NULL THEN 'company' ELSE 'lead' END as parent_type,
             COALESCE(comp.company_name, TRIM(CONCAT(lead_p.first_name, ' ', lead_p.last_name))) as parent_name,
             TRIM(CONCAT(u.first_name, ' ', u.last_name)) as owner_name, comp.city, comp.country
      FROM deals d
      LEFT JOIN companies comp ON d.company_id = comp.id
      LEFT JOIN leads lead_p ON d.lead_id = lead_p.id
      LEFT JOIN users u ON u.id = d.owner_id[1]
      WHERE (d.deal_name ILIKE :searchTerm OR lead_p.first_name ILIKE :searchTerm OR lead_p.last_name ILIKE :searchTerm OR comp.company_name ILIKE :searchTerm)
      AND (:role = 'admin' OR :userId = ANY(d.owner_id)) ORDER BY d.id DESC LIMIT 10
    `, options));
  }

  // TICKETS
  if (!filterType || filterType === 'ticket') {
    queries.push(sequelize.query(`
      SELECT DISTINCT ON (t.id) t.id, t.ticket_name AS name, NULL as email, 'ticket' as type, t.ticket_status as status,
             t.priority, t.source, TRIM(CONCAT(lead_p.first_name, ' ', lead_p.last_name)) as relationship_name,
             t.company_id as parent_id, 'company' as parent_type, comp.company_name as parent_name,
             TRIM(CONCAT(u.first_name, ' ', u.last_name)) as owner_name, comp.city, comp.country
      FROM tickets t
      LEFT JOIN companies comp ON t.company_id = comp.id
      LEFT JOIN leads lead_p ON lead_p.company_id = comp.id
      LEFT JOIN users u ON u.id = t.owner_id[1]
      WHERE (t.ticket_name ILIKE :searchTerm OR t.description ILIKE :searchTerm OR comp.company_name ILIKE :searchTerm OR lead_p.first_name ILIKE :searchTerm OR lead_p.last_name ILIKE :searchTerm)
      AND (:role = 'admin' OR :userId = ANY(t.owner_id)) ORDER BY t.id DESC LIMIT 10
    `, options));
  }

  // ACTIVITIES (Aggregated)
  const actSQL = (table, type, label, fields, contentField) => `
    SELECT DISTINCT ON (act.related_type, act.related_id, act.id)
      act.id as activity_real_id, act.related_id as id, 
      COALESCE(l.name, c.company_name, d.deal_name, t.ticket_name) AS name, 
      act.related_type as parent_table, '${type}' as type, '${label}' as status,
      ${contentField} as activity_content,
      act.related_id as parent_id, act.related_type as parent_type, 
      COALESCE(l.name, c.company_name, d.deal_name, t.ticket_name) as parent_name,
      TRIM(CONCAT(l2.first_name, ' ', l2.last_name)) as relationship_name,
      '${type}' as activity_type
    FROM ${table} act
    LEFT JOIN (SELECT id, TRIM(CONCAT(first_name, ' ', last_name)) as name FROM leads) l ON act.related_id = l.id AND act.related_type = 'leads'
    LEFT JOIN companies c ON act.related_id = c.id AND act.related_type = 'companies'
    LEFT JOIN deals d ON act.related_id = d.id AND act.related_type = 'deals'
    LEFT JOIN tickets t ON act.related_id = t.id AND act.related_type = 'tickets'
    LEFT JOIN leads l2 ON (
      (act.related_type = 'leads' AND act.related_id = l2.id) OR
      (act.related_type = 'companies' AND l2.company_id = act.related_id) OR
      (act.related_type = 'deals' AND (d.lead_id = l2.id OR d.company_id = l2.company_id)) OR
      (act.related_type = 'tickets' AND t.company_id = l2.company_id)
    )
    WHERE (${fields} OR l.name ILIKE :searchTerm OR c.company_name ILIKE :searchTerm OR d.deal_name ILIKE :searchTerm OR t.ticket_name ILIKE :searchTerm)
    AND (:role = 'admin' OR act.user_id = :userId)
    ORDER BY act.id DESC LIMIT 10
  `;

  if (!filterType || filterType === 'note') queries.push(sequelize.query(actSQL('notes', 'note', 'Note', 'act.content ILIKE :searchTerm', 'act.content'), options));
  if (!filterType || filterType === 'email') queries.push(sequelize.query(actSQL('emails', 'email', 'Email', 'act.subject ILIKE :searchTerm OR act.body ILIKE :searchTerm', 'act.subject'), options));
  if (!filterType || filterType === 'call') queries.push(sequelize.query(actSQL('calls', 'call', 'Call', 'act.connected_to ILIKE :searchTerm OR act.note ILIKE :searchTerm', 'act.note'), options));
  if (!filterType || filterType === 'meeting') queries.push(sequelize.query(actSQL('meetings', 'meeting', 'Meeting', 'act.title ILIKE :searchTerm OR act.note ILIKE :searchTerm', 'act.note'), options));
  if (!filterType || filterType === 'task') queries.push(sequelize.query(actSQL('tasks', 'task', 'Task', 'act.task_name ILIKE :searchTerm OR act.note ILIKE :searchTerm', 'act.note'), options));

  const rawResults = await Promise.all(queries);
  const flatResults = rawResults.flatMap(res => res);

  const groupMap = new Map();
  flatResults.forEach(item => {
    if (!item.parent_id || !item.parent_type) return;
    const key = `${item.parent_type}:${item.parent_id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        groupName: item.parent_name || "Contextual Match",
        groupType: item.parent_type,
        groupId: item.parent_id,
        items: [],
        activities: {} // Aggregated activities
      });
    }
    const group = groupMap.get(key);

    if (['note', 'email', 'call', 'meeting', 'task'].includes(item.type)) {
      // Aggregate into activities summary instead of individual items
      const typeKey = `${item.type}s`; // notes, emails, etc.
      if (!group.activities[typeKey]) {
        group.activities[typeKey] = item.activity_content || "Record exists";
      }
    } else {
      const exists = group.items.some(i => i.id === item.id && i.type === item.type);
      if (!exists) group.items.push(item);
    }
  });

  // Convert activities map to a single virtual "activities" result item for each group
  groupMap.forEach(group => {
    if (Object.keys(group.activities).length > 0) {
      group.items.push({
        id: group.groupId,
        type: 'activities',
        name: `${group.groupName} - Activities`,
        relationship_name: group.groupName,
        parent_type: group.groupType, // Key for routing
        metadata: group.activities
      });
    }
  });

  return Array.from(groupMap.values());
}

module.exports = { globalSearch };
