"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config/apiConfig";

export default function useActivities(entityId, entityType) {
  const BASE_URL = `${API_BASE_URL}/api`;
  const [data, setData] = useState([]);

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.warn("⚠️ Response not JSON. Status:", res.status, "Body:", text);
      return { _raw: text, _status: res.status };
    }
  };

  const normalize = (items, type) => {
    if (!Array.isArray(items)) return [];

    return items.map((item) => {
      // 🛠️ ATTACHMENT PARSING
      let attachments = item.attachments || [];
      if (typeof attachments === "string") {
        try {
          attachments = JSON.parse(attachments);
        } catch {
          attachments = [];
        }
      }

      // 🛠️ Standardize USER NAME (Look in multiple places)
      const fName = item.first_name || item.firstName || "";
      const lName = item.last_name || item.lastName || "";
      let userName = `${fName} ${lName}`.trim();

      if (!userName && item.user_name) userName = item.user_name;
      if (!userName && item.sender) userName = item.sender;
      if (!userName && item.author) userName = item.author;

      // 🛠️ Standardize DATE
      const createdAt = item.created_at || item.createdAt || item.date || new Date();

      // Standardize data body for each type
      let formattedData = { ...item };
      const rawContent = item.content || item.note || item.body || "";

      if (type === "note") {
        formattedData.note = rawContent;
      } else if (type === "email") {
        formattedData.body = item.body || item.content || "";
      } else if (type === "call") {
        formattedData.outcome = item.call_outcome || item.outcome || "";
      } else if (type === "task") {
        formattedData.taskName = item.task_name || item.taskName || "Untitled Task";
        formattedData.dueDate = item.due_date || item.dueDate; // ✅ Normalize
        formattedData.time = item.due_time || item.time;       // ✅ Normalize
        formattedData.taskType = item.task_type || item.taskType; // ✅ Normalize
        formattedData.task_completed = Boolean(item.task_completed); // ✅ Force Boolean
      } else if (type === "meeting") {
        formattedData.attendeeNames = item.attendee_names || item.attendeeNames || "";
        formattedData.startDate = item.start_date || item.startDate; // ✅ Normalize
        formattedData.startTime = item.start_time || item.startTime; // ✅ Normalize
        formattedData.endTime = item.end_time || item.endTime;       // ✅ Normalize
      } else if (type === "activity") {
        formattedData.action_text = item.action_text || "";
        formattedData.metadata = item.metadata || {};
      }

      return {
        ...item,
        id: item.id,
        type,
        type_db: item.type, // 🔥 Preserve DB type for generic activities
        createdAt,
        attachments,
        user_name: userName || (item.User ? `${item.User.first_name} ${item.User.last_name || ""}`.trim() : "System"),
        content: rawContent || item.action_text || "", // 🔥 BACKWARD COMPATIBILITY
        data: formattedData,
      };
    });
  };

  // ✅ NO MORE SINGULARIZATION: DB uses plural (leads, deals, etc.)
  const contextType = entityType;

  const fetchData = async () => {
    if (!entityId || !entityType) return;

    try {
      const [notes, emails, tasks, calls, meetings, activities] = await Promise.all([
        fetch(`${BASE_URL}/notes?related_id=${entityId}&related_type=${contextType}`, { credentials: "include" }).then(safeJson),
        fetch(`${BASE_URL}/emails?related_id=${entityId}&related_type=${contextType}`, { credentials: "include" }).then(safeJson),
        fetch(`${BASE_URL}/tasks?related_id=${entityId}&related_type=${contextType}`, { credentials: "include" }).then(safeJson),
        fetch(`${BASE_URL}/calls?related_id=${entityId}&related_type=${contextType}`, { credentials: "include" }).then(safeJson),
        fetch(`${BASE_URL}/meetings?related_id=${entityId}&related_type=${contextType}`, { credentials: "include" }).then(safeJson),
        fetch(`${BASE_URL}/activities?related_id=${entityId}&related_type=${contextType}`, { credentials: "include" }).then(safeJson),
      ]);

      const merged = [
        ...normalize(notes, "note"),
        ...normalize(emails, "email"),
        ...normalize(tasks, "task"),
        ...normalize(calls, "call"),
        ...normalize(meetings, "meeting"),
        ...normalize(activities, "activity"),
      ];

      merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setData(merged);
    } catch (err) {
      console.error("❌ FETCH ERROR:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entityId, entityType]);

  const createActivity = async (activity, userProfile) => {
    if (!entityId || !entityType) return;

    const endpointMap = {
      note: "notes",
      email: "emails",
      task: "tasks",
      call: "calls",
      meeting: "meetings",
    };

    const endpoint = endpointMap[activity.type];

    if (!endpoint) {
      console.error("❌ INVALID ACTIVITY TYPE:", activity.type);
      return;
    }

    // ✅ NORMALIZATION LAYER: Map UI field names to Backend Column names
    let cleanData = { ...activity.data };

    // --- Inject authorship metadata ---
    const fullName = userProfile?.first_name
      ? `${userProfile.first_name} ${userProfile.last_name || ""}`
      : (activity.user_name || "");

    cleanData = {
      ...cleanData,
      sender: fullName,
      author: fullName,
      organizer: fullName,
    };

    if (activity.type === "call") {
      cleanData = {
        note: "",
        ...cleanData,
        connected_to: cleanData.connected || "",
        call_outcome: cleanData.outcome?.value || cleanData.outcome || "No Answer",
        call_date: cleanData.date || new Date().toISOString().split('T')[0],
        call_time: cleanData.time || new Date().toTimeString().split(' ')[0],
      };
      ["connected", "outcome", "date", "time"].forEach(key => delete cleanData[key]);
    }

    if (activity.type === "task") {
      cleanData = {
        status: "Pending",
        priority: "Medium",
        note: "",
        ...cleanData,
        task_name: cleanData.taskName || "Untitled Task",
        due_date: cleanData.dueDate || new Date().toISOString().split('T')[0],
        due_time: cleanData.time || "12:00",
        task_type: cleanData.taskType?.value || cleanData.taskType || "Other",
        assigned_to: cleanData.assignedTo?.value || cleanData.assignedTo || "Unassigned",
        task_completed: false, // 🔥 Initialize as uncompleted
      };
      ["taskName", "dueDate", "time", "taskType", "assignedTo"].forEach(key => delete cleanData[key]);
    }

    if (activity.type === "meeting") {
      cleanData = {
        note: "",
        title: "Untitled Meeting",
        location: "",
        ...cleanData,
        start_date: cleanData.startDate,
        start_time: cleanData.startTime,
        end_time: cleanData.endTime,
        attendee_names: cleanData.attendees || "", // STORE AS NAMES
        attendees_count: 2, // DEFAULT PERSISTENT COUNT
        attendee_ids: [],
      };
      ["startDate", "startTime", "endTime", "attendees"].forEach(key => delete cleanData[key]);
    }

    if (activity.type === "note") {
      cleanData = {
        ...cleanData,
        content: cleanData.note || cleanData.content || "",
      };
    }

    // ✅ PAYLOAD ALIGNMENT (Plural related_type)
    const activeUserId = Number(userProfile?.id || activity.user_id) || 1;

    const payload = {
      related_id: Number(entityId),
      related_type: contextType,
      data: cleanData,
      user_id: activeUserId,
    };

    try {
      console.log(`🚀 ATTEMPTING SAVE [${activity.type}] to ${endpoint}:`, payload);

      const res = await fetch(`${BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      // Get raw text first to handle non-JSON errors
      const rawBody = await res.text();
      let result = {};
      try {
        result = JSON.parse(rawBody);
      } catch {
        result = { _raw: rawBody };
      }

      if (!res.ok) {
        console.group("❌ CREATE ERROR DETAILS");
        console.error("Status Code:", res.status);
        console.error("Endpoint:", endpoint);
        console.error("Raw Body:", rawBody);
        console.error("Parsed Result:", result);
        console.groupEnd();

        // Final fallback: Show the error to the user if it's not JSON
        if (typeof window !== 'undefined') {
          alert(`SAVE FAILED (${res.status}): ${rawBody.slice(0, 100)}`);
        }
        return;
      }

      console.log("✅ SAVE SUCCESSFUL:", result);

      // ✅ SUCCESS ALERT (Temporary verification)
      if (typeof window !== 'undefined') {
        console.log(`🎉 SUCCESS: ${activity.type} stored in DB.`);
      }

      fetchData();
    } catch (err) {
      console.error("❌ NETWORK/FETCH ERROR:", err);
    }
  };

  return {
    activities: data,
    fetchData,
    createActivity,
  };
}