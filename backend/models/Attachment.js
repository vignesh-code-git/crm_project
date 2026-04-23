const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Attachment = sequelize.define("Attachment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  file_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  file_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  file_type: {
    type: DataTypes.STRING(100),
  },
  file_size: {
    type: DataTypes.INTEGER,
  },
  mime_type: {
    type: DataTypes.STRING(100),
  },
  attachment_type: {
    type: DataTypes.ENUM('note', 'email', 'call', 'task', 'meeting', 'custom'),
  },
  attachment_id: {
    type: DataTypes.INTEGER,
  },
  uploaded_by: {
    type: DataTypes.INTEGER,
    references: {
      model: "users",
      key: "id",
    },
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  related_id: {
    type: DataTypes.INTEGER,
  },
  related_type: {
    type: DataTypes.ENUM('leads', 'companies', 'deals', 'tickets'),
  },
}, {
  tableName: "attachments",
  timestamps: false,
});

module.exports = Attachment;
