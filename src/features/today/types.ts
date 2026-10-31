export type PlanBlockStatus = 'done' | 'next' | 'later';

export type PlanBlock = {
  id: string;
  label: string;
  pages: number;
  status: PlanBlockStatus;
};

export type DailyPlan = {
  dateLabel: string;
  pages: number;
  minutes: number;
  streak: number;
  message: string;
  blocks: PlanBlock[];
};
