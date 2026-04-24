"use client";

import React from 'react';
import styles from './about.module.css';
import { 
  HiOutlineUsers, 
  HiOutlineShieldCheck, 
  HiOutlineCpuChip, 
  HiOutlineSparkles,
  HiOutlinePresentationChartLine,
  HiOutlineHeart
} from "react-icons/hi2";

export default function AboutPage() {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <span className={styles.badge}>v1.0.0 Stable</span>
        <h1 className={styles.title}>The CRM Project</h1>
        <p className={styles.subtitle}>
          A high-performance, intelligent relationship management ecosystem designed to streamline interactions and accelerate business growth.
        </p>
      </header>

      <section className={styles.contentSection}>
        <h2 className={styles.sectionTitle}>
          <HiOutlineSparkles /> Core Capabilities
        </h2>
        <div className={styles.grid}>
          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <HiOutlineUsers />
            </div>
            <h3>Unified Relationship Management</h3>
            <p>Seamlessly track Leads, Companies, and Deals in a centralized dashboard with real-time updates and relational data integrity.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <HiOutlineCpuChip />
            </div>
            <h3>Intelligent Automation</h3>
            <p>Leveraging modern tech stacks to automate repetitive tasks, from activity logging to smart notifications and search discovery.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <HiOutlineShieldCheck />
            </div>
            <h3>Enterprise-Grade Security</h3>
            <p>Built with a focus on data privacy and secure authentication, ensuring your business relationships are always protected.</p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.iconWrapper}>
              <HiOutlinePresentationChartLine />
            </div>
            <h3>Advanced Data Analytics</h3>
            <p>Transform raw data into actionable insights with comprehensive reporting and visual analytics on your sales pipeline.</p>
          </div>
        </div>
      </section>

      <section className={styles.creatorSection}>
        <p className={styles.creatorTitle}>Build and Development</p>
        <h2 className={styles.creatorName}>Created by Vignesh</h2>
        <p style={{ opacity: 0.9, maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>
          Dedicated to building intuitive software that empowers teams to focus on what matters most: accelerating strategic business growth and excellence.
        </p>
      </section>

      <footer className={styles.footer}>
        <p>Built with Next.js, PostgreSQL, and Innovation.</p>
        <p>Vignesh © {currentYear} All rights reserved.</p>
      </footer>
    </div>
  );
}
