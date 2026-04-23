"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";
import { API_BASE_URL } from "@/config/apiConfig";
import StatusBar from "../../../components/ui/StatusBar/StatusBar.js";
import ProgressBar from "../../../components/ui/ProgressBar/ProgressBar.js";
import ChartBox from "../../../components/ui/Chart/Chart.js";
import TeamPerformanceTable from "@/components/ui/TeamPerformanceTable/TeamPerformanceTable";
import { DashboardSkeleton } from "../../../components/ui/Skeleton/DashboardSkeletons";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        credentials: "include",
      });

      if (!res.ok) {
        router.push("/login");
        return;
      }

      const data = await res.json();

      if (data.role !== "admin") {
        router.push("/login");
        return;
      }

      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.container}>
      <StatusBar />

      <div className={styles.bottom}>
        <ProgressBar />
        <ChartBox />
      </div>

      <TeamPerformanceTable />
    </div>
  );
}