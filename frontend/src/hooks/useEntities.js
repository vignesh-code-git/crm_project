"use client";
import { useEffect, useState } from "react";
import { showError } from "@/services/toastService";
import { API_BASE_URL } from "@/config/apiConfig";

export default function useApiEntity(entity) {

  const API = `${API_BASE_URL}/api/${entity}`;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // 🔥 FETCH DATA (SAFE)
  // =========================
const fetchData = async () => {
  setLoading(true);
  try {
    const res = await fetch(API, {
      credentials: "include",
    });

    const result = await res.json();

    console.log("🔥 API RESPONSE:", result); // 👈 ADD THIS

    setData(Array.isArray(result) ? result : []);
  } catch (err) {
    console.error(err);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchData();
  }, [entity]);

  // =========================
  // 🔥 CREATE (FIXED)
  // =========================
  const createEntity = async (item) => {
    try {
      // 🔥 FIX owner_id (array → single)
      const payload = {
        ...item,
        owner_id: Array.isArray(item.owner_id)
          ? item.owner_id[0]
          : item.owner_id,
      };

      console.log("🚀 CREATE PAYLOAD:", payload);

      const res = await fetch(API, {
        method: "POST",
        credentials: "include", // 🔥 REQUIRED
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      let data = {};

      try {
        data = await res.json();
      } catch {
        console.warn("⚠️ Response not JSON");
      }

      if (!res.ok) {
        console.error("❌ API ERROR:", data);
        alert(data?.error || "Create failed");
        return;
      }

      console.log("✅ Created:", data);

      fetchData();
    } catch (err) {
      console.error("❌ NETWORK ERROR:", err);
      alert("Network error");
    }
  };

  // =========================
  // 🔥 UPDATE (FIXED)
  // =========================
  const updateEntity = async (item) => {
    try {
      const payload = {
        ...item,
        owner_id: Array.isArray(item.owner_id)
          ? item.owner_id[0]
          : item.owner_id,
      };

      const res = await fetch(`${API}/${item.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const rawText = await res.text().catch(() => "");
        let data = {};
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          console.log("❌ NON-JSON UPDATE ERROR RESPONSE:", rawText);
        }

        console.log("❌ UPDATE ERROR:", data);
        // showError(data?.error || "Update failed"); // ❌ REMOVED TOAST
        return data?.error || data?.message || "Update failed"; // 🔥 RETURN ERROR STRING
      }

      fetchData();
      return true; // 🔥 SUCCESS
    } catch (err) {
      console.log("❌ NETWORK ERROR:", err);
      return "Network error";
    }
  };

  // =========================
  // 🔥 DELETE (SAFE)
  // =========================
  const deleteEntity = async (id) => {
    try {
      const res = await fetch(`${API}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const rawText = await res.text().catch(() => "");
        let data = {};
        try {
          data = JSON.parse(rawText);
        } catch (e) {
          console.log("❌ NON-JSON ERROR RESPONSE:", rawText);
        }
        
        console.log("❌ DELETE ERROR:", data);
        // showError(data?.error || "Delete failed"); // ❌ REMOVED TOAST
        return data?.error || data?.message || "Delete failed"; // 🔥 RETURN ERROR STRING
      }

      fetchData();
      return true; // 🔥 SUCCESS
    } catch (err) {
      console.error("❌ NETWORK ERROR:", err);
      return "Network error";
    }
  };

  // =========================
  // 🔥 CONVERT (LEADS ONLY)
  // =========================
  const convertEntity = async (id) => {
    if (entity !== "leads") return;

    try {
      const res = await fetch(`${API}/${id}/convert`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      console.log("🔄 Convert:", data);

      fetchData();
      return res;
    } catch (err) {
      console.error("❌ CONVERT ERROR:", err);
    }
  };

  // =========================
  // 🔥 BULK CREATE
  // =========================
  const bulkCreateEntity = async (items) => {
    try {
      const res = await fetch(`${API}/bulk`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(items),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Bulk create failed");
      }

      fetchData();
      return true;
    } catch (err) {
      console.error("❌ BULK CREATE ERROR:", err);
      throw err;
    }
  };

  // =========================
  // 🔥 BULK DELETE
  // =========================
  const bulkDeleteEntity = async (ids) => {
    try {
      const res = await fetch(`${API}/bulk-delete`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return data.error || data.message || "Bulk delete failed";
      }

      fetchData();
      return true;
    } catch (err) {
      console.error("❌ BULK DELETE ERROR:", err);
      return "Network error";
    }
  };

  return {
    data,
    loading,
    createEntity,
    bulkCreateEntity,
    updateEntity,
    deleteEntity,
    bulkDeleteEntity,
    convertEntity,
  };
}