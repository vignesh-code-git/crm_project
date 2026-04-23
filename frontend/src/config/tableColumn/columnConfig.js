export const entityConfig = {
  leads: {
    title: "Leads",

    columns: [
      { key: "checkbox", type: "checkbox" },
      { key: "first_name", label: "NAME" },
      { key: "email", label: "EMAIL" },
      { key: "phone", label: "PHONE NUMBER" },
      { key: "date", label: "CREATED DATE" },
      { key: "lead_status", label: "LEADSTATUS", type: "status" },
      { key: "company_name", label: "COMPANY" },
      { key: "owner_name", label: "LEAD OWNER" },
      { key: "actions", label: "ACTIONS", type: "actions" },
    ],

    searchFields: ["first_name", "email", "phone", "owner_name", "lead_status", "company_name"],
  },

  companies: {
    title: "Companies",

    columns: [
      { key: "checkbox", type: "checkbox" },
      { key: "company_name", label: "COMPANY NAME" },
      { key: "email", label: "EMAIL" },
      { key: "phone", label: "PHONE NUMBER" },
      { key: "industry", label: "INDUSTRY" },
      { key: "city", label: "CITY" },
      { key: "country", label: "COUNTRY/REGION" },
      { key: "owner_name", label: "COMPANY OWNER" },
      { key: "date", label: "CREATED DATE" },
      { key: "actions", label: "ACTIONS", type: "actions" },
    ],

    searchFields: ["company_name", "phone", "city", "country", "owner_name", "email", "industry"],
  },

  deals: {
    title: "Deals",

    columns: [
      { key: "checkbox", type: "checkbox" },
      { key: "deal_name", label: "DEAL NAME" },
      { key: "deal_stage", label: "DEAL STAGE", type: "status" },
      { key: "lead_name", label: "ASSOCIATED LEAD" },
      { key: "close_date", label: "CLOSE DATE" },
      { key: "owner_name", label: "DEAL OWNER" },
      { key: "amount", label: "AMOUNT" },
      { key: "company_name", label: "COMPANY" },
      { key: "actions", label: "ACTIONS", type: "actions" },
    ],

    searchFields: ["deal_name", "owner_name", "deal_stage", "lead_name", "company_name"],
  },

  tickets: {
    title: "Tickets",

    columns: [
      { key: "checkbox", type: "checkbox" },
      { key: "ticket_name", label: "TICKET NAME" },
      { key: "ticket_status", label: "TICKET STATUS", type: "status" },
      { key: "deal_name", label: "DEAL NAME" },
      { key: "company_name", label: "COMPANY" },
      { key: "priority", label: "PRIORITY" },
      { key: "source", label: "SOURCE" },
      { key: "owner_name", label: "TICKET OWNER" },
      { key: "date", label: "CREATED DATE" },
      { key: "actions", label: "ACTIONS", type: "actions" },
    ],

    searchFields: ["ticket_name", "deal_name", "owner_name", "ticket_status", "company_name", "priority", "source"],
  },
};