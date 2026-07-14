import { create } from "zustand";
import { GoalWithProgress } from "@/features/goals/services/goal.service";

interface GoalState {
  goals: GoalWithProgress[];
  /** Incomplete goals, for summary views like the dashboard. */
  activeGoals: GoalWithProgress[];

  setGoals: (goals: GoalWithProgress[]) => void;
}

export const useGoalStore = create<GoalState>((set) => ({
  goals: [],
  activeGoals: [],

  setGoals: (goals) => {
    set({ goals, activeGoals: goals.filter((g) => !g.isCompleted) });
  },
}));
