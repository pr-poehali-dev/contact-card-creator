export interface Contact {
  id: number;
  name: string;
  role: string;
  telegram: string;
  color: string;
  created_by?: number | null;
  order_index?: number;
}

export interface Editor {
  id: number;
  username: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  role: string;
}

export const CONTACTS_URL = "https://functions.poehali.dev/8ac292f9-91df-4949-911c-f0fee6ad4870";
export const EDITORS_URL = "https://functions.poehali.dev/419aca2d-b4f5-4523-8db0-dd42edf442f4";
export const CHANGE_PASSWORD_URL = "https://functions.poehali.dev/29b968a6-e9e5-41e9-a806-fd45fb51170f";

export const colorOptions = [
  { value: "from-purple-500 to-pink-500", label: "Фиолетово-розовый" },
  { value: "from-blue-500 to-cyan-500", label: "Сине-голубой" },
  { value: "from-violet-500 to-purple-500", label: "Фиолетовый" },
  { value: "from-green-500 to-emerald-500", label: "Зеленый" },
  { value: "from-orange-500 to-red-500", label: "Оранжево-красный" },
  { value: "from-pink-500 to-rose-500", label: "Розовый" }
];
