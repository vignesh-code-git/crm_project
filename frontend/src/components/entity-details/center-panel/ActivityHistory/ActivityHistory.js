"use client";

import styles from "./ActivityHistory.module.css";
import ActivityItem from "../ActivityItem/ActivityItem";

export default function ActivityHistory({
  activities,
  activeTab,
  search,
  onCreate,
  entityType
}) {
  let filtered = activities;

  // 🔥 FILTER BY ENTITY CONTEXT (Hide cross-entity noise)
  if (entityType === "leads") {
    // Leads only show their own notes, emails, etc. No Ticket/Deal creation/status logs.
    filtered = filtered.filter(a => a.type !== "activity");
  } else if (entityType === "companies") {
    // Companies only show Ticket activity (as requested), hide Deal activity.
    filtered = filtered.filter(a => {
      if (a.type !== "activity") return true;
      const isDeal = a.related_type === "deals" || a.type_db === "deal_creation";
      return !isDeal;
    });
  }

  if (activeTab !== "activity") {
    filtered = filtered.filter((a) => a.type === activeTab);
  }

  if (search) {
    filtered = filtered.filter((a) => {
      const text = JSON.stringify(a.data).toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }

  filtered = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const tasks = filtered.filter((a) => a.type === "task");
  const otherActivities = filtered.filter((a) => a.type !== "task");

  const grouped = {};

  otherActivities.forEach((activity) => {
    const date = new Date(activity.createdAt);
    const month = date.toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
    if (!grouped[month]) {
      grouped[month] = [];
    }
    grouped[month].push(activity);
  });

  const labelMap = {
    note: "Create Note",
    email: "Create Email",
    call: "Make a phone call",
    task: "Create Task",
    meeting: "Create Meeting"
  };

  const titleMap = {
    note: "Notes",
    email: "Emails",
    call: "Calls",
    task: "Tasks",
    meeting: "Meetings"
  };

  return (
    <div className={styles.wrapper}>
      {activeTab !== "activity" && (
        <div className={styles.sectionHeader}>
          <h3 className={styles.title}>
            {titleMap[activeTab]}
          </h3>
          <button
            className={styles.createBtn}
            onClick={() => onCreate(activeTab)}
          >
            {labelMap[activeTab]}
          </button>
        </div>
      )}

      {(tasks.length > 0 || ((entityType === "deals" || entityType === "tickets") && activeTab === "activity")) && (
        <div className={styles.timeline}>
          {activeTab === "activity" && (
            <div className={styles.upcoming}>
              Upcoming
            </div>
          )}
          {tasks.map((task) => (
            <ActivityItem
              key={task.id}
              activity={task}
            />
          ))}
        </div>
      )}

      <div className={styles.timeline}>
        {Object.keys(grouped).length === 0 && tasks.length === 0 && (
          <div className={styles.empty}>
            No activities yet
          </div>
        )}
        {Object.keys(grouped).map((month) => (
          <div key={month}>
            <div className={styles.month}>
              {month}
            </div>
            {grouped[month].map((activity) => (
              <ActivityItem
               key={`${activity.type}-${activity.id}`}
                activity={activity}
                entityType={entityType}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}