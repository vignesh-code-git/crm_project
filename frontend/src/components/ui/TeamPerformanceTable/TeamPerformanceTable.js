"use client";

import styles from "./TeamPerformanceTable.module.css";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/apiConfig";

// INR formatter
const formatINR = (num) => {
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${Math.round(num / 1000)}k`;
  return `₹${num}`;
};

import TableSkeleton from "../Skeleton/TableSkeleton";

export default function TeamPerformanceTable() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/team-performance`, {
      credentials: "include", // 🔥 IMPORTANT
    })
      .then(async (res) => {
        const result = await res.json();

        if (!res.ok) {
          console.error("API ERROR:", result);
          return [];
        }

        return result;
      })
      .then((result) => {
        if (!Array.isArray(result)) {
          console.error("Invalid data:", result);
          return;
        }

        setData(result);
      })
      .catch((err) => {
        console.error("FETCH ERROR:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Team Performance Tracking</h2>
        </div>
        <TableSkeleton rows={5} columns={4} />
      </div>
    );
  }

  // EXPORT CSV
  const exportCSV = () => {
    if (!data.length) return;

    const headers = [
      "Employee",
      "Active Deals",
      "Closed Deals",
      "Revenue (INR)",
      "Growth (%)",
    ];

    const rows = data.map((item) => [
      item.name,
      item.active,
      item.closed,
      item.revenue,
      item.growth.toFixed(1),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "team-performance.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2>Team Performance Tracking</h2>
        <button className={styles.exportBtn} onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className={styles.tableWrapper}>
        <div className={styles.table}>
          <div className={styles.headRow}>
            <div>Employee</div>
            <div>Active Deals</div>
            <div>Closed Deals</div>
            <div className={styles.right}>Revenue</div>
          </div>

          {data.map((item, index) => {
            const isPositive = item.growth > 0;
            const isNegative = item.growth < 0;

            return (
              <div key={index} className={`${styles.dataRow} ${item.isSystem ? styles.systemRow : ""}`}>
                <div className={`${styles.name} ${item.isSystem ? styles.systemName : ""}`}>
                  {item.isSystem ? `📂 ${item.name}` : `👤 ${item.name}`}
                </div>
                <div>{item.active}</div>
                <div>{item.closed}</div>

                <div className={`${styles.revenue} ${styles.right}`}>
                  {formatINR(item.revenue)}

                  <span
                    className={`${styles.badge} ${
                      isPositive
                        ? styles.green
                        : isNegative
                        ? styles.red
                        : styles.gray
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {item.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}