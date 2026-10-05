// Illustrative product data. No user data or authenticated API is used on the public page.
export const previewWeeks = {
  next: {
    label: "Next 7 days",
    values: [980, 1120, 860, 620, 940, 1180, 1140],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    note: "Thursday looks quieter. Keep a little extra aside.",
    lowDay: 3,
  },
  previous: {
    label: "Last 7 days",
    values: [840, 1020, 760, 580, 920, 1120, 1060],
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    note: "Your weekend earnings helped balance a quieter Thursday.",
    lowDay: 3,
  },
};
export const healthFactors = [
  {
    label: "Cash cushion",
    value: 80,
    weight: 30,
    detail: "2.4 months of expenses covered",
  },
  {
    label: "Debt safety",
    value: 90,
    weight: 25,
    detail: "Debt is manageable relative to expenses",
  },
  {
    label: "Income stability",
    value: 60,
    weight: 20,
    detail: "Some variation across earning days",
  },
  {
    label: "Earnings outlook",
    value: 70,
    weight: 15,
    detail: "Forecast is above your recent average",
  },
  {
    label: "Tracking consistency",
    value: 70,
    weight: 10,
    detail: "More daily entries build a clearer picture",
  },
];
export const faqs = [
  {
    question: "Who is Finspire for?",
    answer:
      "Delivery partners, drivers, freelancers, and anyone whose income changes from day to day. Your financial plan should fit how you earn.",
  },
  {
    question: "How do I add my earnings?",
    answer:
      "Create an account, complete your financial profile, then log daily income manually or upload a CSV. Your dashboard brings the history, forecasts, and financial health together.",
  },
  {
    question: "What goes into my financial health score?",
    answer:
      "Five weighted factors: cash cushion (30%), debt safety (25%), income stability (20%), earnings outlook (15%), and tracking consistency (10%). The dashboard explains each factor and the next actions available to you.",
  },
  {
    question: "Will it always tell me to invest?",
    answer:
      "No. The product checks financial health, emergency savings, debt, income volatility, and available surplus first. If those checks do not pass, it prioritizes building your buffer or reducing debt. Investment guidance is informational; returns are not guaranteed.",
  },
  {
    question: "Are the numbers on this page my actual finances?",
    answer:
      "These are illustrative examples so you can explore how the product works without signing in. Your personal dashboard uses your financial profile and income entries. Forecasts are estimates, not promised earnings.",
  },
];
export const rupees = (value) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;
