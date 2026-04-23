export const ticketFields = [
  {
    name: "ticket_name",
    label: "Ticket Name",
    type: "text",
    required: true,
  },
  {
    name: "deal_id",
    label: "Deal Name",
    type: "select",
    placeholder: "Select Associated Deal",
  },
  {
    name: "company_id",
    label: "Company",
    type: "select",
  },
  {
    name: "description",
    label: "Description",
    type: "textarea",
  },
  {
    name: "ticket_status",
    label: "Ticket Status",
    type: "select",
    required: true,
    defaultValue: "New",
    options: [
      "New",
      "Waiting on contact",
      "Waiting on us",
      "In Progress",
      "Resolved",
      "Closed",
    ],
  },
  {
    name: "source",
    label: "Source",
    type: "select",
    options: ["Email", "Phone", "Chat"],
  },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    required: true,
    placeholder: "Select Priority",
    options: ["Low", "Medium", "High", "Critical"],
  },
  {
    name: "owner_id",
    label: "Ticket Owner",
    type: "select",
   
  },
];