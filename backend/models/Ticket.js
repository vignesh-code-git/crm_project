const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Ticket = sequelize.define("Ticket", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  ticket_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  ticket_status: {
    type: DataTypes.ENUM('New', 'Waiting on contact', 'Waiting on us', 'In Progress', 'Resolved', 'Closed'),
    defaultValue: 'New',
  },
  source: {
    type: DataTypes.STRING(100),
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  owner_id: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  },
  company_id: {
    type: DataTypes.INTEGER,
  },
  deal_id: {
    type: DataTypes.INTEGER,
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "tickets",
  timestamps: false,
});

module.exports = Ticket;
