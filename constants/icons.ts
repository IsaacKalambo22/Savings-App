// Account icon options — maps to @expo/vector-icons (Ionicons)
export const ACCOUNT_ICONS = [
  { key: "wallet",        label: "Wallet",       icon: "wallet-outline" },
  { key: "home",          label: "Home",         icon: "home-outline" },
  { key: "briefcase",     label: "Business",     icon: "briefcase-outline" },
  { key: "person",        label: "Personal",     icon: "person-outline" },
  { key: "heart",         label: "Family",       icon: "heart-outline" },
  { key: "cart",          label: "Groceries",    icon: "cart-outline" },
  { key: "cash",          label: "Cash",         icon: "cash-outline" },
  { key: "car",           label: "Car",          icon: "car-outline" },
  { key: "school",        label: "Education",    icon: "school-outline" },
  { key: "medical",       label: "Medical",      icon: "medical-outline" },
  { key: "airplane",      label: "Travel",       icon: "airplane-outline" },
  { key: "gift",          label: "Gifts",        icon: "gift-outline" },
  { key: "fitness",       label: "Fitness",      icon: "fitness-outline" },
  { key: "restaurant",    label: "Food",         icon: "restaurant-outline" },
  { key: "phone-portrait",label: "Mobile",       icon: "phone-portrait-outline" },
  { key: "shield",        label: "Insurance",    icon: "shield-outline" },
] as const;

export type AccountIconKey = typeof ACCOUNT_ICONS[number]["key"];
