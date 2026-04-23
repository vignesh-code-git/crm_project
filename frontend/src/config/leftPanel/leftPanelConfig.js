export const entityConfig = {

  leads: {
    label: "Leads",
    route: "/leads",
    aboutTitle: "About this lead",
    fields: [
      { key:"email",label:"Email" },
      { key:"first_name",label:"First Name" },
      { key:"last_name",label:"Last Name" },
      { key:"phone",label:"Phone number" },
      { key:"lead_status",label:"Lead Status" },
      { key:"job_title",label:"Job Title" },
      { key:"date",label:"Created Date" }
    ]
  },

  companies: {
    label: "Companies",
    route: "/companies",
    aboutTitle: "About this company",
    fields: [
      { key:"domain",label:"Company Domain Name" },
      { key:"companyName",label:"Company Name" },
      { key:"industry",label:"Industry" },
      { key:"phone",label:"Phone number" },
      { key:"owner",label:"Company Owner" },
      { key:"city",label:"City" },
      { key:"country",label:"Country/Region" },
      { key:"employees",label:"No of Employees" },
      { key:"revenue",label:"Annual Revenue" },
      { key:"date",label:"Created Date" }
    ]
  },

  deals: {
    label: "Deals",
    route: "/deals",
    aboutTitle: "About this deal",
    fields: [
      { key:"owner",label:"Deal Owner" },
      { key:"priority",label:"Priority" },
      { key:"date",label:"Created Date" }
    ]
  },

  tickets: {
    label: "Tickets",
    route: "/tickets",
    aboutTitle: "About this ticket",
    fields: [
      { key:"description",label:"Ticket Description" },
      { key:"owner",label:"Ticket Owner" },
      { key:"priority",label:"Priority" },
      { key:"date",label:"Created Date" }
    ]
  }

};