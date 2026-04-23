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
  },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: ["Customer", "Partner"],
  },
  {
    name: "city",
    label: "City",
    type: "text",
  },
  {
    name: "country",
    label: "Country/Region",
    type: "text",
  },
  {
    name: "no_of_employees",
    label: "No of Employees",
    type: "text",
  },
  {
    name: "annual_revenue",
    label: "Revenue",
    type: "text",
  },
  {
    name: "phone",
    label: "Phone Number",
    type: "phone",
    required: true,
  },
];