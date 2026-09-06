import { TableStatus } from "@prisma/client";

export const tableStatusLabel: Record<TableStatus, string> = {
  available: "空闲",
  occupied: "用餐中",
  reserved: "预留",
  dirty: "待清台",
  billing: "结账中",
};

export const tableStatusColor: Record<TableStatus, string> = {
  available: "#2F6F4E",
  occupied: "#B45309",
  reserved: "#1D4ED8",
  dirty: "#6B7280",
  billing: "#9F1239",
};

export const allowedStatusTransitions: Record<TableStatus, TableStatus[]> = {
  available: ["occupied", "reserved"],
  occupied: ["billing", "available", "dirty"],
  reserved: ["available", "occupied"],
  dirty: ["available"],
  billing: ["dirty", "occupied", "available"],
};
