export interface UserAnalyticsData {
  totalProjects:    number;
  totalEdits:       number;
  creditsUsed:      number;
  creditsTotal:     number;
  creditsRemaining: number;
  recentActivity:   ActivityItem[];
}

export type ActivityItemType =
  | "edit_made"
  | "project_created"
  | "credit_purchased"
  | "plan_changed";

export interface ActivityItem {
  id:          string;
  type:        ActivityItemType;
  description: string;
  createdAt:   string;
  meta?:       Record<string, unknown>;
}
