import styles from "./CurrencyCell.module.css";

export default function CurrencyCell({ amount }) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);

  return <span className={styles.currency}>{formatted}</span>;
}