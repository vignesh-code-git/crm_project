export const taskFields = [

{
name:"taskName",
label:"Task Name",
type:"text",
required:true
},

{
name:"dueDate",
label:"Due Date",
type:"date",
required:true
},

{
name:"time",
label:"Time",
type:"time",
required:true
},

{
name:"taskType",
label:"Task Type",
type:"select",
options:["Call","Email","Meeting"],
required:true
},

{
name:"priority",
label:"Priority",
type:"select",
options:["Low","Medium","High"],
required:true
},

{
name:"assignedTo",
label:"Assigned to",
type:"select",
multiple:true
},

{
name:"note",
label:"Note",
type:"rich_textarea",
required:true
}

]