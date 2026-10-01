import apiClient from "@/lib/axios";
import type { Task, ReschedulePayload } from "../types";

/**
 * POST /api/v1/tasks/{id}/reschedule/ — endpoint de reprogramación oficial.
 * Valida el límite de sobrecarga diaria (6h), audita en RescheduleHistory
 * y retorna HTTP 409 Conflict si la reprogramación excede el límite.
 */
export async function rescheduleTask(id: number, payload: ReschedulePayload): Promise<Task> {
  const newDate = payload.new_date || payload.scheduled_date;
  const newHours = payload.new_hours !== undefined 
    ? Number(payload.new_hours) 
    : (payload.estimated_hours !== undefined ? Number(payload.estimated_hours) : undefined);

  const body = {
    new_date: newDate,
    new_hours: newHours,
    reason: payload.reason || "Reprogramación de tarea",
  };

  const { data } = await apiClient.post<Task>(`/tasks/${id}/reschedule/`, body);
  return data;
}
