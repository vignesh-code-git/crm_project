// 🎯 TOAST SERVICE (CUSTOM)

// 🎯 ACTION → MESSAGE MAP
const actionMap = {
  create: "created successfully",
  update: "edited successfully",
  delete: "deleted successfully",
  error: "something went wrong",
  warning: "check this action",
};

// 🎯 ENTITY FORMATTER
const formatEntity = (entity) => {
  switch (entity) {
    case "companies": return "Company";
    case "deals": return "Deal";
    case "tickets": return "Ticket";
    default: return "Lead";
  }
};

// 🎯 MAIN TOAST FUNCTION (REUSABLE)
export const showToast = ({
  entity = "leads",
  action = "create",
  type = "success", // success | error | warning | info
  message, // optional custom message
  metadata = {}, 
  duration = 5000
}) => {
  const entitySingular = formatEntity(entity);
  const targetName = metadata?.target_name || "Record";
  const finalMessage = message || `${entitySingular} **${targetName}** ${actionMap[action] || "processed successfully"}`.trim();

  // 🔥 Trigger Custom UI Toast via Event
  const event = new CustomEvent("triggerCustomToast", {
    detail: {
      notification: {
        type,
        title: message ? "Notification" : `${entitySingular} ${action === 'create' ? 'Created' : action === 'update' ? 'Edited' : 'Deleted'}`,
        message: finalMessage,
        created_at: new Date().toISOString(),
        metadata
      },
      duration
    }
  });
  window.dispatchEvent(event);

  // 🔔 Also trigger an instant refresh of the notification icon/panel
  window.dispatchEvent(new Event("refetchNotifications"));
};

// ==========================
// OPTIONAL SHORTCUTS
// ==========================

export const showSuccess = (msg) => showToast({ message: msg, type: "success" });
export const showError = (msg) => showToast({ message: msg, type: "error" });
export const showWarning = (msg) => showToast({ message: msg, type: "warning" });
export const showInfo = (msg) => showToast({ message: msg, type: "info" });