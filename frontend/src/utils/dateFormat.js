export const formatDate = (date) => {
  if (!date) return "";

  const d = new Date(date);

  // ✅ Date part (WITH comma)
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }); // Apr 8, 2025

  // ✅ Time part
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }); // 2:35 PM

  // ✅ Timezone (India)
  const timezone = "GMT+5:30";

  return `${datePart} ${timePart} ${timezone}`;
};