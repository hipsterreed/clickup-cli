export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color?: string;
  profilePicture?: string;
}

export interface ClickUpStatus {
  status: string;
  color: string;
  orderindex: number;
  type: string;
}

export interface ClickUpPriority {
  id: string;
  priority: string;
  color: string;
  orderindex: string;
}

export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: ClickUpStatus;
  priority?: ClickUpPriority;
  assignees: ClickUpUser[];
  list: { id: string; name: string };
  folder?: { id: string; name: string };
  space?: { id: string };
  due_date?: string;
  date_created: string;
  date_updated: string;
  url: string;
  tags?: Array<{ name: string; tag_fg: string; tag_bg: string }>;
  parent?: string;
}

export interface ClickUpComment {
  id: string;
  comment: Array<{ text: string }>;
  comment_text: string;
  user: ClickUpUser;
  date: string;
  resolved: boolean;
}

export interface ClickUpList {
  id: string;
  name: string;
  statuses: ClickUpStatus[];
  folder?: { id: string; name: string; hidden: boolean };
  space: { id: string; name: string };
  task_count?: number;
  date_updated?: string;
  orderindex?: number;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  lists?: ClickUpList[];
}

export interface ClickUpSpace {
  id: string;
  name: string;
}

export interface ClickUpTeam {
  id: string;
  name: string;
  color?: string;
  members?: Array<{ user: ClickUpUser }>;
}

export interface RecentList {
  id: string;
  name: string;
}

export interface ClickUpConfig {
  apiToken: string;
  teamId: string;
  userId: number;
  username: string;
  email: string;
  recentLists?: RecentList[];
}

export interface TaskFilters {
  me?: boolean;
  listId?: string;
  statuses?: string[];
  priorities?: string[];
  includeClosed?: boolean;
  subtasks?: boolean;
  orderBy?: string;
  limit?: number;
  showDesc?: boolean;
}
