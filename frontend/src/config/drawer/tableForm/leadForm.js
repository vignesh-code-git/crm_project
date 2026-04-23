export const leadFields = [
  {
    name: "email",
    label: "Email",
    type: "text",
    required: false,
  },
  {
    name: "first_name",
    label: "First Name",
    type: "text",
    required: true,
  },

  {
    name: "last_name",
    label: "Last Name",
    type: "text",
    required: true,
  },
  {
    name: "company_id",
    label: "Companies",
    type: "select",
    defaultValue: "",
    placeholder: "Select Company (Optional)",
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "phone",
    required: true,
  },
  {
    name: "job_title",
    label: "Job Title",
    type: "text",
  },
  {
    name: "owner_id",
    label: "Lead Owner",
    type: "select",

  },
  {
    name: "lead_status",
    label: "Lead Status",
    type: "select",
    defaultValue: "New",
    options: [
      "New",
      "Open",
      "In Progress",
      "Contacted",
      "Qualified",
      "Converted",
      "Disqualified",
    ],
  },
];