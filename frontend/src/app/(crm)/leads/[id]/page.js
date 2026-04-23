"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import styles from "./page.module.css";
import { API_BASE_URL } from "@/config/apiConfig";

import LeftPanel from "@/components/entity-details/left-panel/LeftLayout/LeftLayout";
import CenterPanel from "@/components/entity-details/center-panel/CenterLayout/CenterLayout";
import RightPanel from "@/components/entity-details/right-panel/RightPanel/RightPanel";

import useEntities from "@/hooks/useEntities";
import Drawer from "@/components/crm-drawer/Drawer/Drawer";
import DetailsSkeleton from "@/components/ui/Skeleton/DetailsSkeleton";

import { BsLayoutSidebar, BsLayoutSidebarReverse } from "react-icons/bs";
import CallOverlay from "@/components/ui/CallOverlay/CallOverlay";
import { showSuccess, showError } from "@/services/toastService";

import { noteFields } from "@/config/drawer/activityForm/noteForm";
import { emailFields } from "@/config/drawer/activityForm/emailForm";
import { callFields } from "@/config/drawer/activityForm/callForm";
import { taskFields } from "@/config/drawer/activityForm/taskForm";
import { meetingFields } from "@/config/drawer/activityForm/meetingForm";

// ✅ HOOK (IMPORTANT CHANGE)
import useActivities from "@/hooks/useActivities";

export default function LeadsDetailsPage() {
  const entity = "leads";
  
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") || "activity";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync tab if URL changes (e.g. from search)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const { id } = useParams();
  const { data } = useEntities(entity);

  const [entityState, setEntityState] = useState(null);
  const [drawerType, setDrawerType] = useState(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 🔥 New: Shared refresh trigger

  // 📞 CALL STATE
  const [isCalling, setIsCalling] = useState(false);
  const [callData, setCallData] = useState(null);
  const [callSid, setCallSid] = useState(null); // 📞 NEW
  const [callStatus, setCallStatus] = useState("initiated"); // 📞 NEW


  // =========================
// LEADS (STATE + FETCH + OPTIONS + FIELDS)
// =========================
const [leads, setLeads] = useState([]);

useEffect(() => {
  fetch(`${API_BASE_URL}/api/leads`)
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setLeads(data);
      } else if (Array.isArray(data?.data)) {
        setLeads(data.data);
      } else {
        setLeads([]);
      }
    })
    .catch(err => {
      console.error("Leads fetch error:", err);
      setLeads([]);
    });
}, []);

const leadOptions = Array.isArray(leads)
  ? leads.map((lead) => ({
      label: `${lead.first_name} ${lead.last_name}`,
      value: lead.id,
    }))
  : [];

// 🔹 Inject into meeting fields
// const dynamicMeetingFields = meetingFields.map((field) => {
//   if (field.name === "attendees") {
//     return {
//       ...field,
//       options: leadOptions,
//     };
//   }
//   return field;
// });




    /* =========================
     LOGGED USER
  ==========================*/

  const [user, setUser] = useState(null);

useEffect(() => {
  fetch(`${API_BASE_URL}/api/users/profile`, {
    credentials: "include",
  })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => console.error(err));
}, []);




  // ✅ Hook usage
  const {
    activities,
    createActivity
  } = useActivities(entityState?.id, entity);

  const handleHangUp = useCallback((duration, forceOutcome) => {
    // 1️⃣ Priority: Close UI immediately
    setIsCalling(false);
    
    // ⏹️ TERMINATE REAL CALL IF MANUAL HANGUP (User clicked End Call)
    if (!forceOutcome && callSid) {
      fetch(`${API_BASE_URL}/api/calls/terminate/${callSid}`, { 
        method: 'POST',
        credentials: "include"
      })
        .catch(err => console.error("Termination failed:", err));
    }

    setCallSid(null);
    
    // 🕒 GET CURRENT DATE/TIME
    const now = new Date();
    const date = now.toISOString().split("T")[0];
    const time = now.toTimeString().split(" ")[0].slice(0, 5);

    // 🧠 SMART OUTCOME: 
    let finalOutcome = forceOutcome;
    if (!finalOutcome) {
      finalOutcome = callStatus === "in-progress" ? "Connected" : "No Answer";
    }

    setCallData({
      connected: `${entityState?.first_name} ${entityState?.last_name}`,
      outcome: finalOutcome,
      date: date,
      time: time,
      duration: duration || "00:00",
      note: "Call logged via system."
    });

    setCallStatus("initiated"); 
    setDrawerType("call");
  }, [callSid, callStatus, entityState, setDrawerType]);

  // 🔄 POLLING CALL STATUS
  useEffect(() => {
    let pollInterval;

    if (isCalling && callSid) {
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/calls/status/${callSid}`, {
            credentials: "include"
          });
          const data = await res.json();
          const status = data.status;

          console.log("Twilio Status:", status);

          if (status === "in-progress") {
            setCallStatus("in-progress");
          } else if (status === "ringing") {
            setCallStatus("ringing");
          } else if (["completed", "busy", "no-answer", "failed", "canceled"].includes(status)) {
            clearInterval(pollInterval);
            
            // 🕒 FORMAT DURATION (Twilio returns seconds)
            const durSeconds = parseInt(data.duration) || 0;
            const mins = Math.floor(durSeconds / 60);
            const secs = durSeconds % 60;
            const formattedDur = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            // 📞 SET FINAL STATUS
            let finalStatus = status;
            if (status === "completed" && durSeconds === 0) finalStatus = "busy";
            setCallStatus(finalStatus);

            // 🧠 IMPROVED MAPPING
            let mappedOutcome = "Connected";
            if (status === "busy" || (status === "completed" && durSeconds === 0)) {
              mappedOutcome = "Busy";
            } else if (status === "no-answer" || status === "canceled" || status === "failed") {
              mappedOutcome = "Not Connected";
            }
            
            // ⏱️ DELAY BEFORE OPENING DRAWER
            setTimeout(() => {
              handleHangUp(formattedDur, mappedOutcome);
            }, 600);
          }
        } catch (err) {
          console.error("Status check failed:", err);
        }
      }, 1000); // 🚀 Faster polling (1s)
    }

    return () => clearInterval(pollInterval);
  }, [isCalling, callSid, entityState, handleHangUp]);

  /* =========================
     FIND ENTITY (WITH FALLBACK)
  ========================= */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const found = data.find((e) => String(e.id) === String(id));
    if (found) {
      setEntityState(found);
      setLoading(false);
    } else {
      // Fallback: Fetch single entity
      console.log(`Fallback fetching lead: ${id}`);
      fetch(`${API_BASE_URL}/api/leads/${id}`, {
        credentials: "include",
        cache: "no-store" // 🔥 DISABLE CACHE
      })
        .then(async (res) => {
          console.log(`[LEAD FALLBACK] Status: ${res.status} ${res.statusText}`);
          if (!res.ok) {
            const errorText = await res.text();
            console.error(`[LEAD FALLBACK] Server error (${res.status}):`, errorText);
            return { error: `Server error: ${res.status}` };
          }
          const text = await res.text();
          try {
            return JSON.parse(text);
          } catch (e) {
            console.error("[LEAD FALLBACK] Failed to parse JSON body:", text);
            return { error: "Invalid JSON response from server" };
          }
        })
        .then(data => {
          console.log("[LEAD FALLBACK] Final data parsed:", data);
          if (data && !data.error && Object.keys(data).length > 0) {
            setEntityState(data);
          } else {
             console.error("[LEAD FALLBACK] Error or empty data received:", data);
          }
        })
        .catch(err => console.error("Fallback fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [data, id]);

  if (loading) {
     return <DetailsSkeleton />;
  }

  if (!entityState) {
    return <div className={styles.notFound}>Entity not found</div>;
  }

  const fieldMap = {
    note: noteFields,
    email: emailFields,
    call: callFields,
    task: taskFields,
    meeting: meetingFields,
  };

  /* =========================
     ACTIONS
  ========================= */
  const handleAction = (type) => {
    setActiveTab(type);
    setDrawerType(type);
  };

  const handleCreate = async (type) => {
    if (type === "call") {
      setIsCalling(true);
      setCallStatus("initiated");
      
      // 🔥 TRIGGER REAL TWILIO CALL
      try {
        const res = await fetch(`${API_BASE_URL}/api/calls/initiate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            phone: entityState?.phone,
            entityName: `${entityState?.first_name} ${entityState?.last_name}`
          })
        });
        const data = await res.json();
        if (data.sid) {
          setCallSid(data.sid);
        }
      } catch (err) {
        console.error("Real call initiation failed:", err);
      }
      return;
    }
    setDrawerType(type);
  };


  const closeDrawer = () => {
    setDrawerType(null);
  };

  /* =========================
     SAVE ACTIVITY (HOOK)
  ========================= */
 

  const handleSave = async (values) => {
    try {
      await createActivity({ type: drawerType, data: values }, user);
      
      // 🔥 SUCCESS TOAST
      const capitalizedType = drawerType ? drawerType.charAt(0).toUpperCase() + drawerType.slice(1) : "Activity";
      showSuccess(`${capitalizedType} created successfully!`);

      setRefreshKey(prev => prev + 1); // 🔥 Trigger Right Panel refresh
      closeDrawer();
    } catch (err) {
      console.error("Save failed:", err);
      showError(`Failed to create ${drawerType || 'activity'}. Please try again.`);
    }
  };



  /* =========================
     CONVERT (Redirection Only)
  ========================= */
  const handleConvert = () => {
    window.location.href = `/deals?leadId=${entityState.id}&leadName=${encodeURIComponent(
      `${entityState.first_name} ${entityState.last_name}`
    )}&companyId=${entityState.company_id || ""}&companyName=${encodeURIComponent(
      entityState.company_name || "No Company"
    )}`;
  };

  return (
    <div className={styles.wrapper}>
      {/* TOP BAR */}
      <div className={styles.topBar}>
        <button
          className={`${styles.iconBtn} ${styles.leftBtn}`}
          onClick={() => setLeftOpen(true)}
        >
          <BsLayoutSidebar />
        </button>

        <button
          className={`${styles.iconBtn} ${styles.rightBtn}`}
          onClick={() => setRightOpen(true)}
        >
          <BsLayoutSidebarReverse />
        </button>
      </div>

      {/* MAIN */}
      <div className={styles.container}>
        <div className={styles.leftDesktop}>
          <LeftPanel
            entity={entityState}
            entityType={entity}
            onUpdate={setEntityState}
            onAction={handleAction}
          />
        </div>

        <CenterPanel
          entityType={entity}
          entityId={entityState.id}
          entity={entityState}
          onCreate={handleCreate}
          onConvert={handleConvert}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          activities={activities}   // ✅ PASS FROM HOOK
        />

        <div className={styles.rightDesktop}>
          <RightPanel entityId={entityState.id} entityType="leads" refreshKey={refreshKey} />
        </div>
      </div>

      {/* LEFT DRAWER */}
      {leftOpen && (
        <div className={styles.overlay} onClick={() => setLeftOpen(false)}>
          <div
            className={styles.leftDrawer}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.close}
              onClick={() => setLeftOpen(false)}
            >
              ✕
            </button>

            <LeftPanel
              entity={entityState}
              entityType={entity}
              onUpdate={setEntityState}
            />
          </div>
        </div>
      )}

      {/* RIGHT DRAWER */}
      {rightOpen && (
        <div className={styles.overlay} onClick={() => setRightOpen(false)}>
          <div
            className={styles.rightDrawer}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.close}
              onClick={() => setRightOpen(false)}
            >
              ✕
            </button>

            <RightPanel entityId={entityState.id} entityType="leads" refreshKey={refreshKey} />
          </div>
        </div>
      )}

      {/* DRAWER */}
      <Drawer
        title={`Create ${drawerType}`}
        data={callData} // 📞 PASS PRE-FILLED DATA
        fields={fieldMap[drawerType]}
        isOpen={!!drawerType}
        emailMode={drawerType === "email"}
        onClose={() => {
          closeDrawer();
          setCallData(null); // Clear after close
        }}
        onSave={(values) => {
          handleSave(values);
          setCallData(null);
        }}
        entity={entityState}
        entityType={entity}
        selectedLeadId={entityState.id}
        activityType={drawerType}
        user={user}
      />

      <CallOverlay
        isActive={isCalling}
        status={callStatus}
        entityName={`${entityState?.first_name} ${entityState?.last_name}`}
        phoneNumber={entityState?.phone}
        onHangUp={(dur) => handleHangUp(dur)}
      />
    </div>
  );
}