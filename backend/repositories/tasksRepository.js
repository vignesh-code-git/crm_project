const { Task, User, sequelize } = require("../models");
const { QueryTypes } = require("sequelize");

// ==========================
// 🔥 HELPERS
// ==========================
const toNull = (val) => {
  if (val === undefined || val === null || val === "" || String(val).toLowerCase() === "nan") {
    return null;
  }
  return val;
};

// 🔥 OVERDUE CALCULATION LOGIC
const checkIsOverdue = (task) => {
  if (task.task_completed) return false;
  if (!task.due_date) return false;

  const now = new Date();
  const due = new Date(task.due_date);
  if (task.due_time) {
    const [h, m] = task.due_time.split(":");
    due.setHours(parseInt(h), parseInt(m), 0);
  } else {
    due.setHours(23, 59, 59);
  }
  return now > due;
};

// ==========================
// 🔥 REPOSITORY
// ==========================

// CREATE TASK
async function createTask({ data, user_id, related_id, related_type }) {
  const task = await Task.create({
    task_name: toNull(data.task_name || data.taskName),
    due_date: toNull(data.due_date || data.dueDate),
    due_time: toNull(data.due_time || data.time),
    task_type: toNull(data.task_type || data.taskType),
    priority: toNull(data.priority),
    status: toNull(data.status),
    assigned_to: Array.isArray(data.assigned_to || data.assignedTo)
      ? (data.assigned_to || data.assignedTo).join(", ")
      : toNull(data.assigned_to || data.assignedTo),
    task_completed: data.task_completed || false,
    over_due: data.over_due || false,
    note: toNull(data.note),
    user_id: toNull(user_id),
    related_id: toNull(related_id),
    related_type: toNull(related_type),
  });
  return task.toJSON();
}

// UPDATE TASK
async function updateTask(id, updates) {
  const task = await Task.findByPk(id);
  if (!task) return null;

  // 🔥 Sync status with task_completed for backward compatibility
  if (updates.task_completed !== undefined) {
    const isDone = updates.task_completed === true || updates.task_completed === "true" || updates.task_completed === 1;
    updates.task_completed = isDone;
    updates.status = isDone ? "Completed" : "Pending";
  }

  await task.update(updates);
  return task.toJSON();
}

// GET TASKS
async function getTasks(related_id, related_type) {
  const result = await Task.findAll({
    where: {
      related_id: toNull(related_id),
      related_type: toNull(related_type)
    },
    include: [{
      model: User,
      attributes: ['first_name', 'last_name']
    }],
    order: [['created_at', 'DESC']]
  });
  
  // Transform to match the expected flat structure with user names
  // 🔥 ALSO: Sync overdue status in DB if needed
  const syncedResults = await Promise.all(result.map(async (t) => {
    const isOverdue = checkIsOverdue(t);
    
    // Only update DB if the status has actually changed
    if (t.over_due !== isOverdue) {
      await t.update({ over_due: isOverdue });
    }

    const json = t.toJSON();
    return {
      ...json,
      first_name: json.User?.first_name || '',
      last_name: json.User?.last_name || ''
    };
  }));

  return syncedResults;
}

module.exports = {
  createTask,
  getTasks,
  updateTask,
};
