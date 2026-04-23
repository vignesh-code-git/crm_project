const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Email = sequelize.define("Email", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  recipients: {
    type: DataTypes.TEXT,
  },
  subject: {
    type: DataTypes.STRING(200),
  },
  body: {
    type: DataTypes.TEXT,
  },
  user_id: {
    type: DataTypes.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
  },
  related_id: {
    type: DataTypes.INTEGER,
  },
  related_type: {
    type: DataTypes.ENUM('leads', 'companies', 'deals', 'tickets'),
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "emails",
  timestamps: false,
});

module.exports = Email;
