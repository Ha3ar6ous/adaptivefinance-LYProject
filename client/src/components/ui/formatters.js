export const money = (value) =>
  `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
export const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};
