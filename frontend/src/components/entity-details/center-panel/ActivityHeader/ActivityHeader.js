"use client";

import styles from "./ActivityHeader.module.css";
import { IoSearchOutline } from "react-icons/io5";

export default function ActivityHeader({ 
  search, 
  setSearch, 
  entityType,
  entity,
  onConvert
}) {

  const isLead = entityType === "leads";

  const status = entity?.lead_status?.toLowerCase();

  const canConvert = status === "qualified";
  const isConverted = status === "converted";

  return (
    <div className={styles.header}>

      {/* Search */}
      <div className={styles.searchWrapper}>
        <IoSearchOutline className={styles.searchIcon} />

        <input
          type="text"
          placeholder="Search activities"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Convert Button */}
      {isLead && (
        <button
          className={styles.convert}
          onClick={() => {
            if (canConvert) onConvert();
          }}
          disabled={!canConvert}
          title={
            isConverted
              ? "Already converted"
              : !canConvert
              ? "Only qualified leads can be converted"
              : ""
          }
        >
          {isConverted ? "Converted" : "Convert"}
        </button>
      )}

    </div>
  );
}