"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TaskStatus } from "@/types";
import apiClient from "@/lib/axios";
import { RescheduleModal } from "@/features/tasks/components/RescheduleModal";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

// ============================================================
// TIPOS
// ============================================================

interface EventTask {
  id: number;
  title: string;
  estimated_hours: number | string;
  scheduled_date: string;
  status: TaskStatus;
}

interface Event {
  id: number;
  title: string;
  description: string;
  event_date: string;
  tasks: EventTask[];

  // Datos de progreso enviados por Django
  progress_percentage: number;
  total_tasks: number;
  completed_tasks: number;
}

// ============================================================
// PÁGINA PROTEGIDA
// ============================================================

export default function EventDetailPage() {
  return (
    <ProtectedRoute>
      <EventDetailContent />
    </ProtectedRoute>
  );
}

// ============================================================
// CONTENIDO DEL DETALLE
// ============================================================

function EventDetailContent() {
  // ============================================================
  // OBTENER ID DE LA URL
  // ============================================================

  const params = useParams<{ id: string }>();

  const eventId = params.id;

  // ============================================================
  // ESTADOS
  // ============================================================

  // Evento recibido desde Django
  const [event, setEvent] = useState<Event | null>(null);

  // Estado de carga
  const [isLoading, setIsLoading] = useState(true);

  // Error de carga
  const [error, setError] = useState<string | null>(null);

  // Tarea que está siendo actualizada
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  // Tarea seleccionada para reprogramar
  const [taskToReschedule, setTaskToReschedule] = useState<EventTask | null>(
    null,
  );

  // Mensaje de éxito
  const [rescheduleSuccess, setRescheduleSuccess] = useState("");

  // ============================================================
  // OBTENER EVENTO
  // ============================================================

  const loadEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // GET /api/v1/events/{id}/
      const response = await apiClient.get<Event>(`/events/${eventId}/`);

      console.log("Evento recibido desde Django:", response.data);

      // Guardamos el evento
      setEvent(response.data);
    } catch (error) {
      console.error("Error al cargar el evento:", error);

      setError("No fue posible cargar el evento.");
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // CARGAR EVENTO AL ABRIR LA PÁGINA
  // ============================================================

  useEffect(() => {
    if (!eventId) {
      return;
    }

    loadEvent();
  }, [eventId]);

  // ============================================================
  // CAMBIAR ESTADO DE UNA TAREA
  // ============================================================

  const handleTaskStatusChange = async (
    taskId: number,
    currentStatus: TaskStatus,
  ) => {
    // Evitamos peticiones simultáneas
    if (updatingTaskId !== null) {
      return;
    }

    try {
      setUpdatingTaskId(taskId);

      // ========================================================
      // DETERMINAR NUEVO ESTADO
      // ========================================================

      const newStatus = currentStatus === "completed" ? "pending" : "completed";

      // ========================================================
      // PATCH /api/v1/tasks/{id}/
      // ========================================================

      await apiClient.patch(`/tasks/${taskId}/`, {
        status: newStatus,
      });

      // ========================================================
      // ACTUALIZAR ESTADO LOCAL
      // ========================================================

      setEvent((currentEvent) => {
        if (!currentEvent) {
          return currentEvent;
        }

        // Actualizamos la tarea
        const updatedTasks = currentEvent.tasks.map((task) => {
          if (task.id === taskId) {
            return {
              ...task,
              status: newStatus as TaskStatus,
            };
          }

          return task;
        });

        // ======================================================
        // CALCULAR PROGRESO
        // ======================================================

        const completedTasks = updatedTasks.filter(
          (task) => task.status === "completed",
        ).length;

        const totalTasks = updatedTasks.length;

        const progressPercentage =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // ======================================================
        // DEVOLVER EVENTO ACTUALIZADO
        // ======================================================

        return {
          ...currentEvent,
          tasks: updatedTasks,
          completed_tasks: completedTasks,
          total_tasks: totalTasks,
          progress_percentage: progressPercentage,
        };
      });
    } catch (error) {
      console.error("Error al actualizar la tarea:", error);

      alert("No fue posible actualizar el estado de la tarea.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  // ============================================================
  // ESTADO DE CARGA
  // ============================================================

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <p className="text-sm text-gray-500">Cargando plan logístico...</p>
      </div>
    );
  }

  // ============================================================
  // ESTADO DE ERROR
  // ============================================================

  if (error || !event) {
    return (
      <div className="mx-auto max-w-5xl p-8">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-600">
            {error || "No se encontró el evento."}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // DATOS PARA EL PROGRESO
  // ============================================================

  const completedTasks = event.tasks.filter(
    (task) => task.status === "completed",
  ).length;

  const totalTasks = event.tasks.length;

  const progressPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ============================================================
  // INTERFAZ
  // ============================================================

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      {/* ======================================================
          HEADER DEL EVENTO
          ====================================================== */}

      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            Plan Logístico
          </span>

          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>

          <p className="mt-1 text-sm text-gray-500">{event.description}</p>
        </div>

        <button
          type="button"
          className="self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 md:self-auto"
        >
          + Añadir Gestión Logística
        </button>
      </div>

      {/* ======================================================
          MENSAJE DE ÉXITO
          ====================================================== */}

      {rescheduleSuccess && (
        <p
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          role="status"
          aria-live="polite"
        >
          {rescheduleSuccess}
        </p>
      )}

      {/* ======================================================
          BARRA DE PROGRESO
          ====================================================== */}

      <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-gray-700">
            Progreso de Preparación del Evento
          </span>

          <span className="font-bold text-indigo-600">
            {progressPercentage}% Completado
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all duration-500"
            style={{
              width: `${progressPercentage}%`,
            }}
          />
        </div>

        <p className="text-xs text-gray-500">
          {completedTasks} de {totalTasks} gestiones logísticas ejecutadas.
        </p>
      </div>

      {/* ======================================================
          LISTADO DE TAREAS
          ====================================================== */}

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">
          Gestiones Logísticas
        </h2>

        {event.tasks.length === 0 ? (
          /* ====================================================
             EMPTY STATE
             ==================================================== */

          <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-sm text-gray-500">
              No hay gestiones planificadas para este evento aún.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {event.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300"
              >
                <div className="flex items-center space-x-3">
                  {/* ==================================================
                      CHECKBOX
                      ================================================== */}

                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() =>
                      handleTaskStatusChange(task.id, task.status)
                    }
                    disabled={updatingTaskId === task.id}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600"
                  />

                  {/* ==================================================
                      INFORMACIÓN DE LA TAREA
                      ================================================== */}

                  <div>
                    <h3
                      className={`text-sm font-semibold ${
                        task.status === "completed"
                          ? "text-gray-400 line-through"
                          : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </h3>

                    <span className="text-xs text-gray-500">
                      Fecha: {task.scheduled_date}
                      {" • "}
                      Est: {task.estimated_hours}h
                    </span>
                  </div>
                </div>

                {/* ====================================================
                    ESTADO
                    ==================================================== */}

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {task.status === "completed" ? "Completado" : "Pendiente"}
                </span>

                {/* ====================================================
                    REPROGRAMAR
                    ==================================================== */}

                <button
                  type="button"
                  onClick={() => setTaskToReschedule(task)}
                  className="rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Reprogramar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================
          MODAL DE REPROGRAMACIÓN
          ====================================================== */}

      <RescheduleModal
        key={`${taskToReschedule?.id ?? "none"}-${!!taskToReschedule}`}
        task={taskToReschedule}
        open={!!taskToReschedule}
        onOpenChange={(open) => !open && setTaskToReschedule(null)}
        onSuccess={() => {
          setRescheduleSuccess("Fecha actualizada");

          loadEvent();
        }}
      />
    </div>
  );
}
