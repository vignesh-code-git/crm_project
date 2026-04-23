"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import PageHeader from "@/components/crm-table/page-header/PageHeader/PageHeader";
import SearchBar from "@/components/crm-table/filters/SearchFilter/SearchFilter";
import SelectFilter from "@/components/crm-table/filters/SelectFilter/SelectFilter";
import DateFilter from "@/components/crm-table/filters/DateFilter/DateFilter";
import Pagination from "@/components/crm-table/filters/Pagination/Pagination";
import Table from "@/components/crm-table/table/TableLayout/TableLayout";
import Drawer from "@/components/crm-drawer/Drawer/Drawer";
import { formatPhone } from "@/utils/phoneFormat";
import { formatDate } from "@/utils/dateFormat";
import { entityConfig } from "@/config/tableColumn/columnConfig";
import { filterConfig } from "@/config/selectFilter/filterConfig";
import { filterData } from "@/services/filterService";
import { showToast } from "@/services/toastService";
import { formConfig } from "@/config/drawer/tableForm/formConfig";
import useEntities from "@/hooks/useEntities";
import PopupMessage from "@/components/ui/PopupMessage/PopupMessage";
import TableSkeleton from "@/components/ui/Skeleton/TableSkeleton";
import ImportModal from "@/components/ui/ImportModal/ImportModal";
import BulkDeleteButton from "@/components/ui/BulkDeleteButton/BulkDeleteButton";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import { API_BASE_URL } from "@/config/apiConfig";


export default function LeadsPage() {

  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const router = useRouter();
  const entity = "leads";
  const { data, loading, createEntity, bulkCreateEntity, updateEntity, deleteEntity, bulkDeleteEntity } = useEntities(entity);
  const config = entityConfig[entity];
  const filtersConfig = filterConfig[entity];
  const { columns, searchFields, title } = config;
  const emptyMessage = "Create Leads...";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const [popup, setPopup] = useState({ show: false, title: "", message: "", type: "error" });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [user, setUser] = useState(null);



  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/profile`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        console.log("✅ USER FETCHED:", data);  // ✅ CORRECT
        setUser(data);
      })
      .catch(err => console.error(err));

  }, []);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("leadId");

    if (id) {
      setSelectedLeadId(id);
      setDrawerOpen(true); // auto open drawer
    }
  }, []);

  // Reset page
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const handleCreate = () => {
    setEditEntity(null);
    setDrawerOpen(true);
  };

  const handleEdit = (row) => {
    setEditEntity(row);
    setDrawerOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await deleteEntity(id);
    if (result === true) {
      showToast({ entity, action: "delete" });
    } else if (typeof result === "string") {
      setPopup({
        show: true,
        title: "Lead Restriction",
        message: result,
        type: "error"
      });
    }
  };

  const handleRowClick = (row) => {
    router.push(`/leads/${row.id}`);
  };

  const handleSave = async (formData) => {
    const now = new Date();

    const isAdmin = user?.role === "admin";
    const rowData = {
      ...formData,
      owner_id: isAdmin
        ? (Array.isArray(formData.owner_id) ? formData.owner_id[0] : formData.owner_id)
        : user?.id,
      multi_owners: isAdmin
        ? (Array.isArray(formData.owner_id) ? formData.owner_id : [formData.owner_id])
        : null // Ensure regular users don't pollute multi_owners
    };

    if (editEntity) {
      const result = await updateEntity({
        ...editEntity,
        ...rowData,
        updated_at: now.toISOString(),
      });

      if (result === true) {
        showToast({ entity, action: "update" });
        setDrawerOpen(false);
      } else if (typeof result === "string") {
        setPopup({
          show: true,
          title: "Lead Locked",
          message: result,
          type: "error"
        });
      }
    } else {
      createEntity({
        ...rowData,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        rawDate: now.toISOString().split("T")[0],
      });
      showToast({ entity, action: "create" });
      setDrawerOpen(false);
    }
  };

  const handleImport = async (csvData) => {
    try {
      await bulkCreateEntity(csvData);
      showToast({ entity, action: "create" });
    } catch (err) {
      console.error("Import error:", err);
      setPopup({
        show: true,
        title: "Import Error",
        message: err.message || "Failed to import data.",
        type: "error"
      });
      throw err;
    }
  };

  const handleExport = () => {
    if (!filteredData.length) return;

    const isAdmin = user?.role === "admin";

    // Define headers for export
    let headers = ["first_name", "last_name", "email", "phone", "job_title", "lead_status", "company_id", "created_at"];

    // Role-based additions
    headers.push("owner_id");

    const csvRows = [
      headers.join(","), // header row
      ...filteredData.map(row => {
        return headers.map(fieldName => {
          let val = row[fieldName];
          if (Array.isArray(val)) val = `{${val.join(", ")}}`; // PostgreSQL array format for multi-owners
          if (val && typeof val === "string" && val.includes(",")) val = `"${val}"`; // Escape commas
          return val || "";
        }).join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `leads_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredData = useMemo(() => {
    return filterData({
      data,
      search,
      searchFields,
      filters,
    });
  }, [data, search, filters, searchFields]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  const paginatedData = filteredData
    .slice((page - 1) * pageSize, page * pageSize)
    .map((entity) => ({
      ...entity,
      phone: formatPhone(entity.phone),
      date: formatDate(entity.created_at),
      owner_name: entity.owner_name,
    }));

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ================= SELECTION STATE ================= */
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Filter deletable rows for "Select All"
  const deletableData = useMemo(() => {
    return data.filter(row => !(row.lead_status === "Converted" && row.has_deals));
  }, [data]);

  const handleSelectRow = (id, checked) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(item => item !== id)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      // Select only deletable ones on CURRENT PAGE
      const currentPageIds = paginatedData
        .filter(row => !(row.lead_status === "Converted" && row.has_deals))
        .map(row => row.id);

      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
    } else {
      // Deselect current page ones
      const currentPageIds = paginatedData.map(row => row.id);
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleBulkDelete = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setBulkLoading(true);
    const result = await bulkDeleteEntity(selectedIds);
    setBulkLoading(false);
    setIsConfirmModalOpen(false);

    if (result === true) {
      showToast({ entity, action: "delete" });
      setSelectedIds([]);
    } else {
      setPopup({
        show: true,
        title: "Bulk Delete Error",
        message: result,
        type: "error"
      });
    }
  };

  const checkDisabledRow = (row) => {
    return row.lead_status === "Converted" && row.has_deals;
  };

  const isAllDeletableOnPageSelected = useMemo(() => {
    const deletableOnPage = paginatedData.filter(row => !checkDisabledRow(row));
    if (deletableOnPage.length === 0) return false;
    return deletableOnPage.every(row => selectedIds.includes(row.id));
  }, [paginatedData, selectedIds]);

  const isSelectAllDisabled = useMemo(() => {
    return paginatedData.filter(row => !checkDisabledRow(row)).length === 0;
  }, [paginatedData]);


  return (
    <div className={styles.layout}>
      <div className={styles.main}>
        <div className={styles.content}>

          <PageHeader
            title={title}
            onCreate={handleCreate}
            onImport={() => setImportModalOpen(true)}
            onExport={handleExport}
          >
            {selectedIds.length > 0 && (
              <BulkDeleteButton
                count={selectedIds.length}
                onDelete={handleBulkDelete}
                loading={bulkLoading}
              />
            )}
          </PageHeader>

          <div className={styles.containerSearch}>
            <div className={styles.topBar}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search Everything..."
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>

          <div className={styles.containerFilter}>
            <div className={styles.filters}>
              {filtersConfig.map((filter) => {
                if (filter.type === "select") {
                  return (
                    <SelectFilter
                      key={filter.key}
                      label={filter.label}
                      value={filters[filter.key] || ""}
                      onChange={(val) =>
                        handleFilterChange(filter.key, val)
                      }
                      options={filter.options}
                    />
                  );
                }

                if (filter.type === "date") {
                  return (
                    <DateFilter
                      key={filter.key}
                      label={filter.label}
                      value={filters[filter.key] || ""}
                      onChange={(val) =>
                        handleFilterChange(filter.key, val)
                      }
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className={styles.tableWrapper}>
            {loading ? (
              <TableSkeleton columns={columns.length} />
            ) : (
              <Table
                columns={columns}
                data={paginatedData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onRowClick={handleRowClick}
                emptyMessage={emptyMessage}
                // Selection Props
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllDeletableOnPageSelected}
                isSelectAllDisabled={isSelectAllDisabled}
                checkDisabledRow={checkDisabledRow}
              />
            )}
          </div>
        </div>
      </div>

      <Drawer
        title={editEntity ? `Edit ${entity}` : `Create ${entity}`}
        fields={formConfig[entity]}
        entity={user}
        isOpen={drawerOpen}
        data={{
          ...editEntity,
          owner_id: editEntity?.owner_ids || editEntity?.owner_id,
          owner_name: editEntity?.owner_name
        }}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
        entityType={entity}
        selectedLeadId={selectedLeadId}
        user={user}
      />

      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={handleImport}
        entityName={title}
        user={user}
      />

      <PopupMessage
        show={popup.show}
        title={popup.title}
        message={popup.message}
        type={popup.type}
        onClose={() => setPopup({ ...popup, show: false })}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete Leads`}
        message={`Are you sure you want to delete ${selectedIds.length} leads? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Leads`}
        loading={bulkLoading}
      />
    </div>
  );
}