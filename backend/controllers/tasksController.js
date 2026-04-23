const repo = require("../repositories/tasksRepository");
const notifRepo = require("../repositories/notificationsRepository");

exports.createTask = async (req, res) => {
  try {
    const { related_id, related_type, data, user_id } = req.body;
    // Object signature: { data, user_id, related_id, related_type }
    const result = await repo.createTask({ data, user_id, related_id, related_type });

    // 🔥 NOTIFICATION
    await notifRepo.createNotification({
      user_id: user_id,
      type: "success",
      message: `A new task "${result.task_name || "Untitled"}" has been assigned in the ${related_type} by **${req.user?.first_name || "System"}**.`,
      metadata: { 
        actor_name: `${req.user?.first_name || ""} ${req.user?.last_name || ""}`.trim()
      },
      entity_type: "tasks",
      entity_id: result.id
    });

    res.json(result);
  } catch (err) {
    console.error("🔥 TASK ERROR FULL:", err);
    console.error("🔥 MESSAGE:", err.message);

    res.status(500).json({
      error: err.message,
      detail: err
    });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { related_id, related_type } = req.query;
    const result = await repo.getTasks(related_id, related_type);
    res.json(result);
  } catch (err) {
    console.error("TASK GET ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 PATCH TASK [${id}]:`, req.body); // 🔥 DEBUG LOG
    const result = await repo.updateTask(id, req.body);
    if (!result) return res.status(404).json({ error: "Task not found" });
    console.log(`✅ PATCH SUCCESS [${id}]:`, result.task_completed); // 🔥 DEBUG LOG
    res.json(result);
  } catch (err) {
    console.error("TASK UPDATE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};
