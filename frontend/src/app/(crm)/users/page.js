"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import PageHeader from "@/components/crm-table/page-header/PageHeader/PageHeader";
import SearchBar from "@/components/crm-table/filters/SearchFilter/SearchFilter";
import SelectFilter from "@/components/crm-table/filters/SelectFilter/SelectFilter";
import Pagination from "@/components/crm-table/filters/Pagination/Pagination";
import Table from "@/components/crm-table/table/TableLayout/TableLayout";
import Drawer from "@/components/crm-drawer/Drawer/Drawer";
import { entityConfig } from "@/config/tableColumn/columnConfig";
import { filterConfig } from "@/config/selectFilter/filterConfig";
import { filterData } from "@/services/filterService";
import { showToast } from "@/services/toastService";
import { formConfig } from "@/config/drawer/tableForm/formConfig";
import useEntities from "@/hooks/useEntities";
import PopupMessage from "@/components/ui/PopupMessage/PopupMessage";
import TableSkeleton from "@/components/ui/Skeleton/TableSkeleton";
import ConfirmModal from "@/components/ui/ConfirmModal/ConfirmModal";
import ImportModal from "@/components/ui/ImportModal/ImportModal";
import BulkDeleteButton from "@/components/ui/BulkDeleteButton/BulkDeleteButton";
import { API_BASE_URL } from "@/config/apiConfig";

export default function UsersPage() {
  const router = useRouter();
  const entity = "users";
  const { data, loading, createEntity, bulkCreateEntity, updateEntity, deleteEntity, bulkDeleteEntity } = useEntities(entity);
  const config = entityConfig[entity];
  const filtersConfig = filterConfig[entity];
  const { columns, searchFields, title } = config;
  const emptyMessage = "No users found...";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [popup, setPopup] = useState({ show: false, title: "", message: "", type: "error" });
  const [isSingleConfirmOpen, setIsSingleConfirmOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Selection state
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    document.title = "Users | CRM";
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/profile`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.role !== "admin") {
          router.push("/dashboard"); 
        }
        setUser(data);
      })
      .catch(err => console.error(err));
  }, [router]);

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

  const handleDelete = (id) => {
    setDeleteId(id);
    setIsSingleConfirmOpen(true);
  };

  const handleConfirmSingleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    const result = await deleteEntity(deleteId);
    setDeleteLoading(false);
    setIsSingleConfirmOpen(false);
    setDeleteId(null);

    if (result === true) {
      showToast({ entity, action: "delete" });
    } else {
      setPopup({
        show: true,
        title: "Deletion Error",
        message: result,
        type: "error"
      });
    }
  };

  const handleBulkDelete = () => {
    setIsBulkConfirmOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    setBulkLoading(true);
    const result = await bulkDeleteEntity(selectedIds);
    setBulkLoading(false);
    setIsBulkConfirmOpen(false);

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

  const handleSave = async (formData) => {
    if (editEntity) {
      const result = await updateEntity({
        ...editEntity,
        ...formData,
      });

      if (result === true) {
        showToast({ entity, action: "update" });
        setDrawerOpen(false);
      } else {
        setPopup({
          show: true,
          title: "Update Failed",
          message: result,
          type: "error"
        });
      }
    } else {
        await createEntity(formData);
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
    if (!sortedData.length) return;

    let headers = ["first_name", "last_name", "email", "phone", "company_name", "industry_type", "country", "role"];

    const csvRows = [
      headers.join(","), 
      ...sortedData.map(row => {
        return headers.map(fieldName => {
          let val = row[fieldName];
          if (val && typeof val === "string" && val.includes(",")) val = `"${val}"`; 
          return val || "";
        }).join(",");
      })
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `users_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedData = useMemo(() => {
    const base = filterData({
      data,
      search,
      searchFields,
      filters,
    });
    // 🔥 ADMIN FIRST
    return [...base].sort((a, b) => {
      if (a.role === "admin" && b.role !== "admin") return -1;
      if (a.role !== "admin" && b.role === "admin") return 1;
      return 0;
    });
  }, [data, search, filters, searchFields]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const paginatedData = sortedData
    .slice((page - 1) * pageSize, page * pageSize);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /* ================= SELECTION LOGIC ================= */
  const handleSelectRow = (id, checked) => {
    setSelectedIds(prev =>
      checked ? [...prev, id] : prev.filter(item => item !== id)
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const currentPageIds = paginatedData.map(row => row.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageIds = paginatedData.map(row => row.id);
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const isAllSelectedOnPage = useMemo(() => {
    if (paginatedData.length === 0) return false;
    return paginatedData.every(row => selectedIds.includes(row.id));
  }, [paginatedData, selectedIds]);

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
                placeholder="Search Users..."
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
              {filtersConfig.map((filter) => (
                <SelectFilter
                  key={filter.key}
                  label={filter.label}
                  value={filters[filter.key] || ""}
                  onChange={(val) => handleFilterChange(filter.key, val)}
                  options={filter.options}
                />
              ))}
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
                emptyMessage={emptyMessage}
                selectedIds={selectedIds}
                onSelectRow={handleSelectRow}
                onSelectAll={handleSelectAll}
                isAllSelected={isAllSelectedOnPage}
                checkDisabledRow={(row) => row.role === "admin"}
              />
            )}
          </div>
        </div>
      </div>

      <Drawer
        title={editEntity ? `Edit User: ${editEntity.first_name}` : `Create New User`}
        fields={formConfig[entity]}
        isOpen={drawerOpen}
        data={editEntity}
        onSave={handleSave}
        onClose={() => setDrawerOpen(false)}
        entityType={entity}
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
        isOpen={isSingleConfirmOpen}
        onClose={() => setIsSingleConfirmOpen(false)}
        onConfirm={handleConfirmSingleDelete}
        title={`Delete User`}
        message={`Are you sure you want to delete this user? This action cannot be undone.`}
        confirmText={`Delete User`}
        loading={deleteLoading}
      />

      <ConfirmModal
        isOpen={isBulkConfirmOpen}
        onClose={() => setIsBulkConfirmOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete Users`}
        message={`Are you sure you want to delete ${selectedIds.length} users? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Users`}
        loading={bulkLoading}
      />
    </div>
  );
}
