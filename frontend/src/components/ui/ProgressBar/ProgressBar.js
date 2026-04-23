"use client";

import { useEffect, useState } from "react";
import styles from "./progressbar.module.css";
import { API_BASE_URL } from "@/config/apiConfig";

function ProgressLine({ label, value, color, delay, count, total }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className={styles.progressItem}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
      </div>

      <div className={styles.progressBarWrapper}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: width + "%",
              background: color,
            }}
          />
        </div>
        {/* Premium Tooltip */}
        <div className={styles.tooltip}>
          <span className={styles.tooltipCount}>
            {count} of {total} {label.toLowerCase().includes("lead") ? "leads" : "deals"} {" "}
            {{
              "Contact": "contacted",
              "Qualified Lead": "qualified",
              "Proposal Sent": "sent",
              "Negotiation": "in negotiation",
              "Closed Won": "won",
              "Closed Lost": "lost"
            }[label] || "processed"} ({value}%)
          </span>
        </div>
      </div>
    </div>
  );
}

import { ProgressBarSkeleton } from "../Skeleton/DashboardSkeletons";

export default function ProgressBar() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/deal-progress`, {
      credentials: "include", // 🔥 IMPORTANT
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok) {
          console.error("API ERROR:", data);
          return [];
        }

        return data;
      })
      .then((data) => {
        if (!data || !Array.isArray(data.items)) {
          console.error("Invalid data:", data);
          return;
        }

        const { totalLeads, totalDeals, items: rawItems } = data;

        const map = {
          "Contact": "linear-gradient(90deg,#6366f1,#8b5cf6)",
          "Qualified Lead": "linear-gradient(90deg,#14b8a6,#2dd4bf)",
          "Proposal Sent": "linear-gradient(90deg,#f59e0b,#fbbf24)",
          "Negotiation": "linear-gradient(90deg,#6366f1,#8b5cf6)",
          "Closed Won": "linear-gradient(90deg,#22c55e,#4ade80)",
          "Closed Lost": "linear-gradient(90deg,#ef4444,#f87171)",

          "Contract Sent": "linear-gradient(90deg,#3b82f6,#60a5fa)",
          "Qualified to Buy": "linear-gradient(90deg,#06b6d4,#22d3ee)",
          "Decision Maker Bought-In": "linear-gradient(90deg,#a855f7,#c084fc)",
          "Appointment Scheduled": "linear-gradient(90deg,#f97316,#fb923c)",
          "Presentation Scheduled": "linear-gradient(90deg,#eab308,#facc15)",
        };

        const formatted = rawItems.map((item, i) => {
          const isDealStage = ["Proposal Sent", "Negotiation", "Closed Won", "Closed Lost"].includes(item.stage);
          return {
            label: item.stage,
            value: item.value,
            count: item.count,
            total: isDealStage ? totalDeals : totalLeads,
            color: map[item.stage] || "#999",
            delay: i * 120,
          };
        });

        setItems(formatted);
      })
      .catch((err) => {
        console.error("FETCH ERROR:", err);
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <ProgressBarSkeleton />;

  return (
    <div className={styles.box}>
      <h3 className={styles.heading}>Contact to Deal Conversion</h3>

      {items.map((item, i) => (
        <ProgressLine key={i} {...item} />
      ))}
    </div>
  );
}