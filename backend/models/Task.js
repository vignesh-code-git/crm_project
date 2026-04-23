const { DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  task_name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  due_date: {
    type: DataTypes.DATEONLY,
  },
  due_time: {
    type: DataTypes.TIME,
  },
  task_type: {
    type: DataTypes.STRING(100),
  },
  priority: {
    type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Completed'),
    defaultValue: 'Pending',
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
  assigned_to: {
    type: DataTypes.STRING(150),
  },
  task_completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  over_due: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  note: {
    type: DataTypes.TEXT,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: "tasks",
  timestamps: false,
});

module.exports = Task;
