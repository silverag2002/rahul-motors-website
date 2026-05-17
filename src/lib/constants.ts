export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://rahul-motors.capricontechnology.com/api";

export const EXPORT_FIELDS = [
  { key: "name", label: "Product Name", defaultChecked: true },
  { key: "brand", label: "Brand", defaultChecked: true },
  { key: "car_name", label: "Car Model", defaultChecked: true },
  { key: "part_no", label: "Part No", defaultChecked: true },
  { key: "minimum_selling_price", label: "Min Sell Price (₹)", defaultChecked: true },
  { key: "total_inventory", label: "Total Inventory", defaultChecked: true },
  { key: "purchase_price", label: "Purchase Price (₹)", defaultChecked: false },
  { key: "description", label: "Description", defaultChecked: false },
  { key: "categories", label: "Categories", defaultChecked: false },
  { key: "godown_breakdown", label: "Godown Breakdown", defaultChecked: false },
];

export const LOG_ACTIONS = [
  "PRODUCT CREATED",
  "PRODUCT UPDATED",
  "PRODUCT QUANTITY INCREASED",
  "PRODUCT QUANTITY DECREASED",
  "CATEGORY CREATED",
  "CATEGORY UPDATED",
] as const;

export const ACTION_COLORS: Record<string, string> = {
  "PRODUCT CREATED": "bg-green-100 text-green-800",
  "PRODUCT UPDATED": "bg-blue-100 text-blue-800",
  "PRODUCT QUANTITY INCREASED": "bg-emerald-100 text-emerald-800",
  "PRODUCT QUANTITY DECREASED": "bg-red-100 text-red-800",
  "CATEGORY CREATED": "bg-purple-100 text-purple-800",
  "CATEGORY UPDATED": "bg-indigo-100 text-indigo-800",
};
