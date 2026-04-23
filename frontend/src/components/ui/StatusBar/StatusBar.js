"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./Statusbar.module.css";
import { API_BASE_URL } from "@/config/apiConfig";
import {
  HiOutlineUsers,
  HiOutlineBriefcase,
  HiOutlineCurrencyDollar,
} from "react-icons/hi";

function CountUp({ value, duration = 900, delay = 0 }) {
  const end = Number(value);
  const startValue = Math.floor(end * 0.75);

  const [display, setDisplay] = useState(startValue);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);

    const startTimer = setTimeout(() => {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;

        const progress = timestamp - startTimeRef.current;
        const percent = Math.min(progress / duration, 1);
        const eased = easeOut(percent);

        const current = startValue + (end - startValue) * eased;
        setDisplay(Math.floor(current));

        if (percent < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };

      rafRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, delay, startValue, end]);

  return <>{display.toLocaleString()}</>;
}

import { StatusBarSkeleton } from "../Skeleton/DashboardSkeletons";

export default function StatusBar() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/statusbar`,{
       credentials: "include", // 🔥 IMPORTANT
    })
    
      .then(res => res.json())
      .then(data => {
        setStats([
          {
            title: "Total Leads",
            value: data.total_leads,
            color: "#6d5efc",
            icon: <HiOutlineUsers />,
          },
          {
            title: "Active Deals",
            value: data.active_deals,
            color: "#22c55e",
            icon: <HiOutlineBriefcase />,
          },
          {
            title: "Closed Deals",
            value: data.closed_deals,
            color: "#ef4444",
            icon: <HiOutlineBriefcase />,
          },
          {
            title: "Monthly Revenue",
            value: data.monthly_revenue,
            color: "#f59e0b",
            icon: <HiOutlineCurrencyDollar />,
          },
        ]);
      })
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <StatusBarSkeleton />;

  return (
    <div className={styles.cards}>
      {stats.map((item, i) => (
        <div key={i} className={styles.card}>
          <div>
            <p className={styles.title}>{item.title}</p>
            <h2 className={styles.value}>
              <CountUp value={item.value} delay={i * 120} />
            </h2>
          </div>

          <div
            className={styles.icon}
            style={{
              background: `linear-gradient(135deg, ${item.color}, #ffffff)`,
            }}
          >
            {item.icon}
          </div>
        </div>
      ))}
    </div>
  );
}