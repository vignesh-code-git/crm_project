export const meetingFields = [

  {
    name: "title",
    label: "Title",
    type: "text",
    required: true
  },

  {
    name: "startDate",
    label: "Start Date",
    type: "date",
    required: true
  },

  {
    name: "startTime",
    label: "Start Time",
    type: "time",
    required: true
  },

  {
    name: "endTime",
    label: "End Time",
    type: "time",
    required: true
  },

  // {
  // name:"attendees",
  // label:"Attendees",
  // type:"select",

  // required:true
  // },

  {
    name: "attendees",
    label: "Attendees",
    type: "select",
    multiple: true,
    required: true
  },

  {
    name: "location",
    label: "Location",
    type: "text"
  },

  {
    name: "reminder",
    label: "Reminder",
    type: "select",
    options: ["10 minutes", "30 minutes", "1 hour"]
  },

  {
    name: "note",
    label: "Note",
    type: "rich_textarea",
    required: true
  }

]