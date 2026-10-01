export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface TaskCategory {
  id: number;
  name: string;
  color: string;    // Hex color, ej. "#FF5733"
  owner: number;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;     // ISO 8601
  event: number | null;       // event id (FK opcional)
  event_title?: string;
  event_course?: string;
  category: number | null;    // category id (FK opcional)
  category_detail: TaskCategory | null;
  owner: number;
  created_at: string;
  updated_at: string;
  provider_name?: string; // blank=True
  provider_company?: string; // blank=True
  scheduled_date: string; // YYYY-MM-DD
  estimated_hours: string | number; // DecimalField
  notes?: string; // blank=True


  
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  event?: number | null;
  category?: number | null;
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>;

export interface ReschedulePayload {
  new_date?: string;
  new_hours?: number;
  reason?: string;
  scheduled_date?: string;
  estimated_hours?: number;
}

export interface DailyOverloadConflictError {
  error: string;
  detail: string;
  target_date: string;
  current_hours: string;
  attempted_hours: string;
  daily_hour_limit: string;
}

export interface ConflictData {
  hasConflict: boolean;
  currentHours: number;
  addedHours: number;
  limitHours: number;
  taskToReschedule?: Task;
}

export type ResolutionAction = 'MOVE_DATE' | 'REDUCE_HOURS' | 'FORCE' | 'CANCEL';

