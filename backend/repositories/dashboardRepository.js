const { Lead, Deal, User, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

exports.getTotalLeadsCount = async () => {
  return await Lead.count();
};

exports.getDealsForStatusBar = async () => {
  const deals = await Deal.findAll({
    attributes: ['deal_stage', 'amount', 'close_date', 'created_at']
  });
  return deals.map(d => d.toJSON());
};

exports.getDealStageProgress = async () => {
  const sql = `
    SELECT 'Total Leads' as deal_stage, (SELECT COUNT(*) FROM leads) as count
    UNION ALL
    SELECT 'Total Deals' as deal_stage, (SELECT COUNT(*) FROM deals) as count
    UNION ALL
    SELECT 'Contact' as deal_stage, (SELECT COUNT(*) FROM leads WHERE lead_status != 'New') as count
    UNION ALL
    SELECT 'Qualified Lead' as deal_stage, (SELECT COUNT(*) FROM leads WHERE lead_status = 'Qualified') as count
    UNION ALL
    SELECT 'Proposal Sent' as deal_stage, (SELECT COUNT(*) FROM deals WHERE deal_stage IN ('Presentation Scheduled', 'Appointment Scheduled')) as count
    UNION ALL
    SELECT 'Negotiation' as deal_stage, (SELECT COUNT(*) FROM deals WHERE deal_stage IN ('Qualified to Buy', 'Contract Sent', 'Decision Maker Bought-In')) as count
    UNION ALL
    SELECT 'Closed Won' as deal_stage, (SELECT COUNT(*) FROM deals WHERE deal_stage = 'Closed Won') as count
    UNION ALL
    SELECT 'Closed Lost' as deal_stage, (SELECT COUNT(*) FROM deals WHERE deal_stage = 'Closed Lost') as count
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
};

exports.getSalesReport = async () => {
  const sql = `
    SELECT 
      DATE_PART('month', COALESCE(close_date, created_at)) AS month_num,
      SUM(
        CASE 
          WHEN LOWER(deal_stage::text) = 'closed won' 
          THEN amount ELSE 0 
        END
      ) AS won,
      SUM(
        CASE 
          WHEN LOWER(deal_stage::text) = 'closed lost' 
          THEN amount ELSE 0 
        END
      ) AS lost
    FROM deals
    GROUP BY month_num
    ORDER BY month_num
  `;
  return await sequelize.query(sql, { type: QueryTypes.SELECT });
};

exports.getAllUsersForPerformance = async () => {
  const users = await User.findAll({
    attributes: ['id', 'first_name', 'last_name']
  });
  return users.map(u => u.toJSON());
};

exports.getAllDealsForPerformance = async () => {
  const deals = await Deal.findAll({
    attributes: ['owner_id', 'deal_stage', 'amount', 'close_date', 'created_at']
  });
  return deals.map(d => d.toJSON());
};
