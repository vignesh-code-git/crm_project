"use client";

import { useEffect, useState } from "react";
import styles from "./Drawer.module.css";
import DrawerForm from "@/components/crm-drawer/DrawerForm/DrawerForm";
import { FiX } from "react-icons/fi";
import { API_BASE_URL } from "@/config/apiConfig";

export default function Drawer({
  title,
  fields,
  isOpen,
  onClose,
  onSave,
  data,
  entityType,
  activityType,
  selectedLeadId,
  entity,
  emailMode,
  user,
}) {
  const [users, setUsers] = useState([]);
  const [leadOptions, setLeadOptions] = useState([]); // Used for Deal -> Lead (Qualified)
  const [allLeads, setAllLeads] = useState([]);       // New: Used for general dropdowns
  const [allLeadsRaw, setAllLeadsRaw] = useState([]); // 🔥 KEEP RAW DATA FOR EMAIL/LOOKUP
  const [companyOptions, setCompanyOptions] = useState([]);
  const [dealOptions, setDealOptions] = useState([]);




  useEffect(() => {
    if (user?.role === "admin") {
      fetch(`${API_BASE_URL}/api/users`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          const list =
            Array.isArray(data)
              ? data
              : Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data?.users)
                  ? data.users
                  : [];

          const formatted = list.map((u) => ({
            label: `${u.first_name} ${u.last_name}`,
            value: Number(u.id),
          }));

          setUsers(formatted);
        })
        .catch(() => setUsers([]));
    }
  }, [entity]);

  useEffect(() => {
    if (isOpen && entityType === "deals") {
      fetch(`${API_BASE_URL}/api/leads`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          // 🔥 FILTER IN JS TO BYPASS DB-SPECIFIC ENUM/CAST ISSUES
          const qualified = list.filter(l => 
            l.lead_status?.toString().trim().toLowerCase() === "qualified"
          );
          console.log(`[DEBUG FRONTEND] Total: ${list.length}, Qualified: ${qualified.length}`);
          setLeadOptions(qualified);
        })
        .catch(() => setLeadOptions([]));
    }

    if (isOpen && entityType === "tickets") {
      fetch(`${API_BASE_URL}/api/deals`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          const formatted = list.map((d) => ({
            label: d.deal_name,
            value: d.id,
            company_id: d.company_id, // ✅ PASS METADATA
          }));
          setDealOptions(formatted);
        })
        .catch(() => setDealOptions([]));
    }
  }, [entityType, isOpen]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/leads`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setAllLeadsRaw(list); // 🔥 STORE RAW
        const formatted = list.map((l) => ({
          label: `${l.first_name} ${l.last_name}`,
          value: l.id,
        }));
        setAllLeads(formatted);
      })
      .catch(() => {
        setAllLeads([]);
        setAllLeadsRaw([]);
      });

    fetch(`${API_BASE_URL}/api/companies`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const formatted = [
          { label: "No Company", value: "" },
          ...list.map((c) => ({
            label: c.company_name,
            value: c.id,
          })),
        ];
        setCompanyOptions(formatted);
      })
      .catch(() => setCompanyOptions([]));

    fetch(`${API_BASE_URL}/api/deals`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const formatted = list.map((d) => ({
          label: d.deal_name,
          value: d.id,
          company_id: d.company_id, // ✅ PASS METADATA
        }));
        setDealOptions(formatted);
      })
      .catch(() => setDealOptions([]));
  }, []);

  const safeFields = fields || [];

  const updatedFields = safeFields.map((field) => {
    // 🔍 RESOLVE LEAD NAME FOR ACTIVITIES
    let leadName = "";
    if (entityType === "leads") {
      leadName = `${entity?.first_name || ""} ${entity?.last_name || ""}`.trim();
    } else if (entityType === "deals") {
      leadName = entity?.lead_name || "";
    } else if ((entityType === "companies" || entityType === "tickets") && entity?.company_name) {
      const match = allLeadsRaw?.find(l => l.company_name === entity.company_name);
      if (match) leadName = `${match.first_name} ${match.last_name}`;
    }

    if (field.name === "lead_id") {
      const options = leadOptions.map((l) => ({
        label: `${l.first_name} ${l.last_name}`,
        value: l.id,
        company_id: l.company_id, // ✅ PASS COMPANY INFO
      }));

      const selectedValue = selectedLeadId || "";
      const hasOption = options.some(opt => String(opt.value) === String(selectedValue));

      // If we have a name from data but no option in the list, inject it to ensure visibility
      if (selectedValue && !hasOption && data?.lead_name) {
        options.push({
          label: data.lead_name,
          value: selectedValue
        });
      }

      return {
        ...field,
        options,
        defaultValue: selectedValue,
        disabled: !!selectedLeadId, // ✅ LOCK ONLY IF CONVERTING
      };
    }

    if (field.name === "owner_id") {
      if (user?.role === "admin") { // 🔥 USE user prop instead of entity
        return {
          ...field,
          type: "select",
          options: users,
          multiple: true,
        };
      }

      return {
        ...field,
        type: "select",
        options: [
          {
            label: `${user?.first_name || ""} ${user?.last_name || ""}`,
            value: user?.id,
          },
        ],
        defaultValue: user?.id, // ✅ AUTO-FILL
        disabled: true,         // ✅ LOCK
      };
    }

    if (field.name === "company_id") {
      return {
        ...field,
        options: companyOptions,
        placeholder: "Choose Company",
        disabled: field.disabled,
      };
    }

    if (field.name === "deal_id") {
      return {
        ...field,
        options: dealOptions,
        placeholder: "Choose Deal",
      };
    }

    if (field.name === "assignedTo" && activityType === "task") {
      // ✅ COMBINE LEAD + OWNERS PARA DROPDOWN
      const ownerNames = entity?.owner_name ? entity.owner_name.split(",").map(n => n.trim()) : [];
      const options = [leadName, ...ownerNames]
        .filter(Boolean)
        .filter((val, idx, self) => self.indexOf(val) === idx)
        .map(n => ({ label: n, value: n }));

      return {
        ...field,
        options,
        defaultValue: leadName ? [leadName, ...ownerNames] : ownerNames
      };
    }

    if (field.name === "attendees" && activityType === "meeting") {
      const ownerNames = entity?.owner_name ? entity.owner_name.split(",").map(n => n.trim()) : [];

      const options = [leadName, ...ownerNames]
        .filter(Boolean)
        .filter((val, idx, self) => self.indexOf(val) === idx) // Unique
        .map(n => ({ label: n, value: n }));

      return {
        ...field,
        options,
        defaultValue: [leadName, ...ownerNames].filter(Boolean).filter((val, idx, self) => self.indexOf(val) === idx)
      };
    }

    if (field.name === "recipients") {
      let leadEmail = entity?.lead_email || entity?.email || "";

      if (!leadEmail && entityType === "companies" && entity?.company_name) {
        const match = allLeadsRaw?.find(l => l.company_name === entity.company_name);
        if (match) leadEmail = match.email;
      } else if (!leadEmail && entityType === "deals" && entity?.lead_id) {
        const match = allLeadsRaw?.find(l => String(l.id) === String(entity.lead_id));
        if (match) leadEmail = match.email;
      } else if (!leadEmail && entityType === "tickets" && entity?.company_name) {
        const match = allLeadsRaw?.find(l => l.company_name === entity.company_name);
        if (match) leadEmail = match.email;
      }

      return {
        ...field,
        defaultValue: leadEmail,
      };
    }

    return field;
  });

  if (!isOpen || !fields) return null;

  const isEmail = title?.toLowerCase().includes("email");

  return (
    <div className={styles.overlay} onClick={onClose}>
      {isEmail ? (
        <div
          className={styles.emailModal}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.emailHeader}>
            <span>New Email</span>
            <FiX className={styles.closeBtn} onClick={onClose} />
          </div>

          <DrawerForm
            fields={updatedFields}
            data={data}
            onSave={onSave}
            onClose={onClose}
            emailMode
            entityType={entityType}
            activityType={activityType}
            selectedLeadId={selectedLeadId}
            entity={entity}
            user={user}   // ✅ MUST PASS
          />
        </div>
      ) : (
        <div
          className={styles.drawer}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h3>{title}</h3>
            <FiX className={styles.closeBtn} onClick={onClose} />
          </div>

          <DrawerForm
            fields={updatedFields}
            data={data}
            onSave={onSave}
            onClose={onClose}
            entityType={entityType}
            activityType={activityType}
            selectedLeadId={selectedLeadId}
            entity={entity}
            user={user}   // ✅ MUST PASS
          />
        </div>
      )}
    </div>
  );
}