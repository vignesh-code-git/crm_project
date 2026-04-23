"use client";

import styles from "./chart.module.css";
import { API_BASE_URL } from "@/config/apiConfig";
import { useState, useEffect } from "react";

// INR formatter
const formatINR = (num) => {
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${Math.round(num / 1000)}k`;
  return `₹${num}`;
};

// Step logic
const getStepSize = (max) => {
  if (max <= 100000) return 10000;
  if (max <= 500000) return 50000;
  if (max <= 1000000) return 100000;
  return 200000;
};

import { ChartSkeleton } from "../Skeleton/DashboardSkeletons";

export default function SalesReport() {
  const [data, setData] = useState([]);
  const [animate, setAnimate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/sales-report`,{
       credentials: "include", // 🔥 IMPORTANT
    })
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) setData(json);
        else setData([]);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));

    // trigger animation
    setTimeout(() => setAnimate(true), 200);
  }, []);

  if (loading) return <ChartSkeleton />;

  const actualMax = Math.max(...data.map((d) => d.light || 0), 1);
  const stepSize = getStepSize(actualMax);

  const finalMax =
    Math.ceil(actualMax / stepSize) * stepSize + stepSize;

  const steps = finalMax / stepSize;

  const yAxisValues = Array.from({ length: steps + 1 }, (_, i) =>
    finalMax - i * stepSize
  );

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <h3>Sales Reports</h3>
      </div>

      <div className={styles.chartWrapper}>
        {/* Y AXIS */}
        <div className={styles.yAxis}>
          {yAxisValues.map((val) => (
            <span key={val}>{formatINR(val)}</span>
          ))}
        </div>

        {/* CHART */}
        <div className={styles.chart}>
          {/* GRID */}
          {yAxisValues.map((_, i) => (
            <div
              key={i}
              className={styles.gridLine}
              style={{
                bottom: `${(i / (yAxisValues.length - 1)) * 100}%`,
              }}
            />
          ))}

          {data.map((item, i) => (
            <div
              key={i}
              className={styles.column}
              style={{ "--delay": `${i * 80}ms` }}
            >
              <div className={styles.barWrap}>
                {/* TOOLTIP */}
                <div className={styles.tooltip}>
                  <b>{item.month}</b>
                  <div>Total: {formatINR(item.light)}</div>
                  <div>Closed Won: {formatINR(item.dark)}</div>
                  <div>Closed Lost: {formatINR(item.lost)}</div>
                </div>

                {/* LIGHT */}
                <div
                  className={styles.barLight}
                  style={{
                    height: animate
                      ? `${Math.max(
                          (item.light / finalMax) * 100,
                          2
                        )}%`
                      : "0%",
                  }}
                />

                {/* DARK */}
                <div
                  className={styles.barDark}
                  style={{
                    height: animate
                      ? `${Math.max(
                          (item.dark / finalMax) * 100,
                          2
                        )}%`
                      : "0%",
                  }}
                />
              </div>

              <span className={styles.month}>{item.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}