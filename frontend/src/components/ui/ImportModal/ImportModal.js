"use client";

import { useState } from "react";
import Papa from "papaparse";
import styles from "./ImportModal.module.css";
import { AiOutlineClose, AiOutlineCloudUpload, AiOutlineDownload } from "react-icons/ai";

export default function ImportModal({ isOpen, onClose, onImport, entityName, user }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv"))) {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const handleDownloadTemplate = () => {
    const isAdmin = user?.role === "admin";

    // Define base fields for each entity
    const fieldsMap = {
      "Leads": ["first_name", "last_name", "email", "phone", "job_title", "lead_status", "company_id"],
      "Deals": ["deal_name", "deal_stage", "amount", "close_date", "company_id", "lead_id"],
      "Companies": ["company_name", "domain_name", "type", "industry", "phone", "no_of_employees", "annual_revenue", "city", "country"],
      "Tickets": ["ticket_name", "description", "ticket_status", "source", "priority", "company_id"],
    };

    let headers = fieldsMap[entityName] || ["name", "email"];

    // Role-based additions
    headers.push("owner_id");

    const csvContent = headers.join(",") + "\n" + headers.map(() => "").join(",");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${entityName.toLowerCase()}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          console.log("Parsed CSV:", results.data);
          await onImport(results.data);
          setLoading(false);
          setFile(null);
          onClose();
        } catch (err) {
          console.error("Import error:", err);
          setError(err.message || "Failed to import data.");
          setLoading(false);
        }
      },
      error: (err) => {
        console.error("Parsing error:", err);
        setError("Failed to parse CSV file.");
        setLoading(false);
      },
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Import {entityName}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <AiOutlineClose />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.uploadArea}>
            <AiOutlineCloudUpload className={styles.uploadIcon} />
            <p>{file ? file.name : "Select a CSV file to upload"}</p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              id="csv-upload"
              hidden
            />
            <label htmlFor="csv-upload" className={styles.label}>
              Browse Files
            </label>
          </div>

          <div className={styles.templateSection}>
            <button className={styles.templateBtn} onClick={handleDownloadTemplate}>
              <AiOutlineDownload /> Download Sample CSV
            </button>
            <p className={styles.templateInfo}>
              Download the template to ensure your CSV has the correct headers based on your role.
            </p>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.info}>
            <p><strong>Note:</strong> CSV headers must match the CRM fields.</p>
            {user?.role === "admin" ? (
              <p className={styles.roleHint}><em>Admin: You can map multiple owners in the 'owner_id' column (comma-separated IDs e.g., 1, 2).</em></p>
            ) : (
              <p className={styles.roleHint}><em>User: Data will be assigned to you by default.</em></p>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={styles.importBtn}
            onClick={handleUpload}
            disabled={!file || loading}
          >
            {loading ? "Importing..." : "Import Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
