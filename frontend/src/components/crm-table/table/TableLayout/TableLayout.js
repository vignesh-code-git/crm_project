import styles from "./TableLayout.module.css";
import TableHeader from "../TableHeader/TableHeader";
import TableRow from "../TableRow/TableRow";

export default function Table({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = "Empty Table...",
  // Selection Props
  onSelectAll,
  isAllSelected,
  isSelectAllDisabled,
  onSelectRow,
  selectedIds = [],
  checkDisabledRow // fn(row) => bool
}) {
  return (
    <div className={styles.container}>

      {/* Scroll Wrapper */}
      <div className={styles.scroll}>

        <table className={styles.table}>

          <TableHeader 
            columns={columns} 
            onSelectAll={onSelectAll}
            isAllSelected={isAllSelected}
            isSelectAllDisabled={isSelectAllDisabled}
          />

          <tbody>

            {/* Empty table message */}
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className={styles.empty}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {data.map((row) => (
              <TableRow
                key={row.id}
                row={row}
                columns={columns}
                onEdit={onEdit}
                onDelete={onDelete}
                isSelected={selectedIds.includes(row.id)}
                onSelect={(checked) => onSelectRow(row.id, checked)}
                isDisabled={checkDisabledRow ? checkDisabledRow(row) : false}
              />
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}