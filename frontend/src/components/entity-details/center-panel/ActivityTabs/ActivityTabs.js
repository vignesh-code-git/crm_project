"use client";

import styles from "./ActivityTabs.module.css";

export default function ActivityTabs({ tabs, activeTab, setActiveTab }) {

  const labelMap = {
    activity: "Activity",
    note: "Notes",
    email: "Emails",
    call: "Calls",
    task: "Tasks",
    meeting: "Meetings"
  };

  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={activeTab === tab ? styles.active : styles.tab}
        >
          {labelMap[tab] || tab}
        </button>
      ))}
    </div>
  );
}