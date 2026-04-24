export const userFields = [
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
    name: "email",
    label: "Email",
    type: "email",
    required: true,
  },
  {
    name: "phone",
    label: "Phone",
    type: "phone",
    required: false,
  },
  {
    name: "company_name",
    label: "Company",
    type: "text",
    required: false,
  },
  {
    name: "industry_type",
    label: "Industry",
    type: "text",
    required: false,
  },
  {
    name: "country",
    label: "Country",
    type: "text",
    required: false,
  },
  {
    name: "role",
    label: "Role",
    type: "select",
    required: true,
    options: [
        { label: "Admin", value: "admin" },
        { label: "User", value: "user" }
    ]
  },
  {
    name: "password",
    label: "Reset Password",
    type: "text",
    placeholder: "Leave blank to keep current",
    required: false,
  },
];
