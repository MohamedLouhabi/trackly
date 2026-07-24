export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type OrgRole = 'owner' | 'admin' | 'member';

// Columns shown on the board, in order.
export const BOARD_COLUMNS: { key: Exclude<TaskStatus, 'archived'>; label: string }[] = [
  { key: 'todo', label: 'To do' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'done', label: 'Done' },
];

export interface Task {
  id: string;
  org_id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Member {
  user_id: string;
  role: OrgRole;
  display_name: string | null;
}

export interface Project {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  role: OrgRole;
}

export interface ActivityItem {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function isAdminRole(role: OrgRole | undefined | null): boolean {
  return role === 'owner' || role === 'admin';
}
