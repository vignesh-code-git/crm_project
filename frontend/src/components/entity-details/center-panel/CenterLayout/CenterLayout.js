"use client";

import { useState } from "react";
import styles from "./CenterLayout.module.css";

import ActivityHeader from "@/components/entity-details/center-panel/ActivityHeader/ActivityHeader";
import ActivityTabs from "@/components/entity-details/center-panel/ActivityTabs/ActivityTabs";
import ActivityHistory from "@/components/entity-details/center-panel/ActivityHistory/ActivityHistory";

import { activityConfig } from "@/config/activity/activityConfig";

export default function CenterPanel({
  entityType,
  entityId,
  onCreate,
  activeTab,
  setActiveTab,
  entity,
  onConvert,
  activities // ✅ coming from page hook
}) {

  const [search, setSearch] = useState("");

  const config = activityConfig[entityType];

  // ✅ ALWAYS SAFE ARRAY
  const safeActivities = Array.isArray(activities) ? activities : [];

  return (
    <div className={styles.panel}>

      <div className={styles.stickyHeader}>
        {/* SEARCH */}
        <ActivityHeader
        search={search}
        setSearch={setSearch}
        entityType={entityType}
        entity={entity}
        onConvert={onConvert}
      />

      {/* TABS */}
      <ActivityTabs
        tabs={["activity", "note", "email", "call", "task", "meeting"]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      </div>

      {/* TIMELINE */}
      <ActivityHistory
        activities={safeActivities}
        activeTab={activeTab}
        search={search}
        onCreate={onCreate}
        entityType={entityType}
      />

    </div>
  );
}