const getUsersFromStorage = () => {
  if (typeof window === "undefined") return [];

  try {
    const data = localStorage.getItem("crm_users");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getProfileFromStorage = () => {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem("crm_user_profile");
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// 🔥 dynamic owner names (STRING ONLY - important for your UI)
const getOwnerOptions = () => {
  const users = getUsersFromStorage();
  const profile = getProfileFromStorage();

  // 🛡️ ADMIN: See everyone
  if (profile?.role === "admin") {
    return users.map(
      (user) => `${user.first_name || ""} ${user.last_name || ""}`.trim()
    );
  }

  // 👤 USER/AGENT: See only themselves
  if (profile) {
    const myName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
    return [myName];
  }

  return [];
};

export const filterConfig = {
  // ======================
  // LEADS
  // ======================
  leads: [
    {
      type: "select",
      key: "lead_status",
      label: "Lead Status",
      options: ["New", "Open", "In Progress", "Contacted", "Qualified", "Converted", "Disqualified"],
    },
    {
      type: "date",
      key: "created_at",
      label: "Created Date",
    },
  ],

  // ======================
  // COMPANIES
  // ======================
  companies: [
    {
      type: "select",
      key: "industry",
      label: "Industry Type",
      options: ["Finance", "Healthcare", "IT", "Education", "Retail"],
    },
    {
      type: "text",
      key: "city",
      label: "City",
      placeholder: "Enter city",
    },
    {
      type: "select",
      key: "country",
      label: "Country/Region",
      options: ["India", "USA", "UK", "Canada", "Australia"],
    },
    {
      type: "select",
      key: "lead_status",
      label: "Lead Status",
      options: ["New", "Contacted", "Qualified", "Lost"],
    },
    {
      type: "date",
      key: "created_at",
      label: "Created Date",
    },
  ],

  // ======================
  // DEALS
  // ======================
  deals: [
    {
      type: "select",
      key: "deal_owner",
      label: "Deal Owner",
      get options() {
        return getOwnerOptions(); // 🔥 dynamic from leads
      },
    },
    {
      type: "select",
      key: "deal_stage",
      label: "Stage",
      options: [
        "Presentation Scheduled",
        "Qualified to Buy",
        "Contract Sent",
        "Appointment Scheduled",
        "Decision Maker Bought-In",
        "Closed Won",
        "Closed Lost",
      ],
    },
    {
      type: "date",
      key: "created_at",
      label: "Created Date",
    },
    {
      type: "date",
      key: "close_date",
      label: "Close Date",
    },
  ],

  // ======================
  // TICKETS
  // ======================
  tickets: [
    {
      type: "select",
      key: "ticket_owner",
      label: "Ticket Owner",
      get options() {
        return getOwnerOptions(); // 🔥 dynamic from leads
      },
    },
    {
      type: "select",
      key: "ticket_status",
      label: "Status",
      options: ["Open", "Closed"],
    },
    {
      type: "select",
      key: "priority",
      label: "Priority",
      options: ["Low", "Medium", "High"],
    },
    {
      type: "date",
      key: "created_at",
      label: "Created Date",
    },
  ],
};