"use client";

import { useState } from "react";
import Header from "../../components/ui/Header/Header.js";
import Sidebar from "../../components/ui/SideBar/SideBar.js";
import styles from "./layout.module.css";

export default function CRMLayout({ children }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={styles.wrapper}>
        <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} />

        <main className={styles.main}>
          {children}
        </main>
      </div>
    </>
  );
}