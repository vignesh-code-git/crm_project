export const filterData = ({
  data,
  search = "",
  searchFields = [],
  filters = {},
}) => {
  if (!Array.isArray(data)) return [];

  return data.filter((item) => {
    // 🔍 SEARCH LOGIC
    const searchText = search.toLowerCase();
    const searchMatch =
      !searchText ||
      searchFields
        .map((field) => item?.[field] || "")
        .join(" ")
        .toLowerCase()
        .includes(searchText);

    // 🎯 FILTER LOGIC
    const filterMatch = Object.entries(filters || {}).every(
      ([key, value]) => {
        if (!value) return true;

        const lowKey = key.toLowerCase();

        // 📅 DATE FILTER (created_at, close_date, etc.)
        if (lowKey.includes("date") || lowKey.includes("_at")) {
          const rawItemValue = item?.[key] || item?.created_at || "";
          if (!rawItemValue) return false;

          try {
            // Convert to YYYY-MM-DD for comparison
            const itemDate = new Date(rawItemValue).toISOString().split("T")[0];
            return itemDate === value;
          } catch {
            return false;
          }
        }

        // 👤 OWNER FILTER (deal_owner, ticket_owner, owner_id)
        if (lowKey.includes("owner")) {
          const ownerField = item?.owner_name || "";
          const primaryOwnerField = item?.primary_owner_name || "";
          
          return (
            ownerField.toLowerCase().includes(String(value).toLowerCase()) ||
            primaryOwnerField.toLowerCase().includes(String(value).toLowerCase()) ||
            String(item?.[key]).toLowerCase() === String(value).toLowerCase() ||
            String(item?.owner_id) === String(value)
          );
        }

        // 🔥 NORMAL MATCH (Status, Stage, Industry)
        return String(item?.[key] || "").toLowerCase() === String(value).toLowerCase();
      }
    );

    return searchMatch && filterMatch;
  });
};