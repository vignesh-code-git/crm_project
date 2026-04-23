"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./sidebar.module.css";
import { API_BASE_URL } from "@/config/apiConfig";

import { LuLayoutDashboard } from "react-icons/lu";
import { RxPeople } from "react-icons/rx";
import { PiBriefcase } from "react-icons/pi";
import { HiOutlineClipboardCheck } from "react-icons/hi";
import { BsTicket } from "react-icons/bs";

export default function SideBar({ open, close }) {
  const pathname = usePathname();
  const [role, setRole] = useState(null);

  // 🔥 FETCH USER ROLE
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        setRole(data.role);
      } catch (err) {
        console.error("Sidebar role fetch error:", err);
      }
    };

    fetchUser();
  }, []);

  // 🔥 MENU (ROLE BASED)
  const menu = [
    ...(role === "admin"
      ? [{ name: "Dashboard", icon: <LuLayoutDashboard />, path: "/dashboard" }]
      : []),

    { name: "Leads", icon: <RxPeople />, path: "/leads" },
    { name: "Companies", icon: <PiBriefcase />, path: "/companies" },
    { name: "Deals", icon: <HiOutlineClipboardCheck />, path: "/deals" },
    { name: "Tickets", icon: <BsTicket />, path: "/tickets" },
  ];

  return (
    <>
      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <ul className={styles.menu}>
          {menu.map((item, i) => {
            const active = pathname === item.path || pathname.startsWith(item.path + "/");

            return (
              <li
                key={i}
                className={`${styles.menuItem} ${
                  active ? styles.active : ""
                }`}
              >
                <Link
                  href={item.path}
                  className={styles.link}
                  onClick={close}
                >
                  <div className={styles.iconCircle}>{item.icon}</div>
                  <span className={styles.label}>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      {open && <div className={styles.overlay} onClick={close}></div>}
    </>
  );
}