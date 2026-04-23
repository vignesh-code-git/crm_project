export const companyFields = [
  {
    name: "company_name",
    label: "Company Name",
    type: "text",
    required: true,
  },
  {
    name: "domain_name",
    label: "Domain Name",
    type: "text",
  },
  {
    name: "email",
    label: "Company Email",
    type: "text",
    required: false,
    placeholder: "Enter company email",
  },
  {
    name: "owner_id",
    label: "Company Owner",
    type: "select",
  },
  {
    name: "industry",
    label: "Industry",
    type: "text",
    halfWidth: true,
  },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: ["Customer", "Partner"],
    halfWidth: true,
  },
  {
    name: "city",
    label: "City",
    type: "text",
    halfWidth: true,
  },
  {
    name: "country",
    label: "Country/Region",
    type: "text",
    halfWidth: true,
  },
  {
    name: "no_of_employees",
    label: "No of Employees",
    type: "text",
    halfWidth: true,
  },
  {
    name: "annual_revenue",
    label: "Revenue",
    type: "text",
    halfWidth: true,
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "phone",
    required: true,
  },
];