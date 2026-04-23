const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Company = sequelize.define("Company", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  company_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  domain_name: {
    type: DataTypes.STRING(150),
  },
  industry: {
    type: DataTypes.STRING(100),
  },
  type: {
    type: DataTypes.STRING(100),
  },
  city: {
    type: DataTypes.STRING(100),
  },
  country: {
    type: DataTypes.STRING(100),
  },
  phone: {
    type: DataTypes.STRING(20),
  },
  email: {
    type: DataTypes.STRING(150),
  },
  no_of_employees: {
    type: DataTypes.INTEGER,
  },
  annual_revenue: {
    type: DataTypes.NUMERIC,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  owner_id: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: []
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "companies",
  timestamps: false,
});

module.exports = Company;
