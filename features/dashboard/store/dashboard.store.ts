import { create } from "zustand";
import { DashboardMetrics } from "@/types/dashboard";

interface DashboardState {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  timeRange: "today" | "week" | "month" | "year";

  setMetrics: (metrics: DashboardMetrics) => void;
  setLoading: (loading: boolean) => void;
  setTimeRange: (range: "today" | "week" | "month" | "year") => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: null,
  isLoading: false,
  timeRange: "month",

  setMetrics: (metrics) => set({ metrics }),
  setLoading: (isLoading) => set({ isLoading }),
  setTimeRange: (timeRange) => set({ timeRange }),
}));
