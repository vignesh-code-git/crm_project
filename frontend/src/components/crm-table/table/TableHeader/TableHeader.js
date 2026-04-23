import CheckboxCell from "../CheckboxCell/CheckboxCell";
import styles from "./TableHeader.module.css";

export default function TableHeader({ 
  columns, 
  onSelectAll, 
  isAllSelected, 
  isSelectAllDisabled 
}) {
  return (
    <thead>
      <tr className={styles.headerRow}>
        {columns.map((col, index) => {
          if (col.type === "checkbox") {
            return (
              <th key={index} className={styles.headerCell}>
                <CheckboxCell 
                  checked={isAllSelected}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  disabled={isSelectAllDisabled}
                  isHeader={true}
                />
              </th>
            );
          }

          return (
            <th key={index} className={styles.headerCell}>
              {col.label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}