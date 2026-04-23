"use client";

import StatusBadge from "../StatusBadge/StatusBadge";
import ActionButtons from "../ActionButtons/ActionButtons";
import CheckboxCell from "../CheckboxCell/CheckboxCell";

import styles from "./TableRow.module.css";

import { useRouter, usePathname } from "next/navigation";
// TableRow component

export default function TableRow({
  row,
  columns,
  onEdit,
  onDelete,
  onSelect,
  isSelected,
  isDisabled
}) {

  const router = useRouter();
  const pathname = usePathname();

  const allowedModules = [
    "leads",
    "companies",
    "deals",
    "tickets"
  ];

  const route = pathname.split("/")[1];

  const module = allowedModules.includes(route)
    ? route
    : null;

  /* ================= DELETE ================= */

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(row.id);
  };


  /* ================= EDIT ================= */

  const handleEdit = () => {
    if (!onEdit) return;
    onEdit(row);
  };

  return (

    <tr
      className={styles.row}
      onClick={() => module && router.push(`/${module}/${row.id}`)}
      style={{ cursor: module ? "pointer" : "default" }}
    >

      {columns.map((col, index) => {

        /* ===== Checkbox ===== */

        if (col.type === "checkbox") {
          return (
            <td
              key={index}
              className={styles.cell}
              onClick={(e) => e.stopPropagation()}
            >
              <CheckboxCell 
                checked={isSelected}
                onChange={(e) => onSelect(e.target.checked)}
                disabled={isDisabled}
              />
            </td>
          );
        }


        /* ===== Status Badge ===== */

        if (col.type === "status") {
          return (
            <td key={index} className={styles.cell}>
              <StatusBadge status={row[col.key]} />
            </td>
          );
        }


        /* ===== Action Buttons ===== */

        if (col.type === "actions") {
          return (
            <td
              key={index}
              className={styles.cell}
              onClick={(e) => e.stopPropagation()}
            >
              <ActionButtons
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </td>
          );
        }


        /* ===== Default Cell ===== */

        const cellContent = (col.key === "company_name" && !row[col.key]) ? (
          "No Company"
        ) : row[col.key];

        return (
          <td key={index} className={styles.cell}>
            {cellContent}
          </td>
        );

      })}

    </tr>

  );
}