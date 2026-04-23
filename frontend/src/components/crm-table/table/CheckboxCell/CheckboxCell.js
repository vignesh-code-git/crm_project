import styles from "./CheckboxCell.module.css";

export default function CheckboxCell({ checked, onChange, disabled, isHeader }) {
  return (
    <input 
      type="checkbox" 
      className={`${styles.checkbox} ${isHeader ? styles.headerCheckbox : ""}`} 
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}