"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Sidebar from "@/components/ui/Sidebar";
import { RescheduleModal } from "@/features/tasks/components/RescheduleModal";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import type { Task, TaskStatus } from "@/features/tasks/types";
import { ProtectedRoute } from "@/shared/components/ProtectedRoute";

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  completed: "Completada",
  cancelled: "Cancelada",
};

function dateAtLocalMidnight(value: string) {
  return new Date(`${value}T00:00:00`);
}

function compareTasks(first: Task, second: Task) {
  const dateDifference =
    dateAtLocalMidnight(first.scheduled_date).getTime() -
    dateAtLocalMidnight(second.scheduled_date).getTime();

  if (dateDifference !== 0) return dateDifference;

  return Number(first.estimated_hours) - Number(second.estimated_hours);
}

function TaskGroup({
  title,
  tasks,
  onReschedule,
  urgency,
}: {
  title: string;
  tasks: Task[];
  onReschedule: (task: Task) => void;
  urgency?: "overdue" | "today";
}) {
  const emphasis =
    urgency === "overdue"
      ? "border-red-200"
      : urgency === "today"
        ? "border-amber-200"
        : "border-gray-200";

  return (
    <section className="space-y-3" aria-labelledby={`group-${title}`}>
      <h2 id={`group-${title}`} className="text-lg font-bold text-gray-900">
        {title}
      </h2>

      {tasks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
          No hay subtareas en este grupo.
        </p>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between ${emphasis}`}
            >
              <div className="space-y-1">
                <p className="font-semibold text-gray-900">{task.title}</p>

                <p className="text-sm text-gray-500">
                  Actividad: {task.event_title ?? "Sin actividad"}
                  {task.event_course ? ` || Curso: ${task.event_course}` : ""}
                </p>

                <p className="text-sm text-gray-500">
                  Fecha programada: {task.scheduled_date} || Horas estimadas:{" "}
                  {task.estimated_hours}
                </p>

                <p className="text-sm text-gray-600">
                  Estado: {STATUS_LABELS[task.status]}
                </p>

                {urgency && (
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      urgency === "overdue"
                        ? "bg-red-100 text-red-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {urgency === "overdue"
                      ? "Vencida: requiere atención"
                      : "Para hoy: requiere atención"}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onReschedule(task)}
                className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Reprogramar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Ruta protegida.
 * Este componente NO ejecuta useTasks().
 * Primero verifica la autenticación.
 */
export default function TodayPage() {
  return (
    <ProtectedRoute>
      <TodayContent />
    </ProtectedRoute>
  );
}

/**
 * Contenido de /hoy.
 * Solo se monta cuando ProtectedRoute confirma
 * que el usuario está autenticado.
 */
function TodayContent() {
  const { data, isLoading, isError, refetch } = useTasks();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");

  const tasks = Array.isArray(data) ? data : (data?.results ?? []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activities = useMemo(
    () =>
      Array.from(
        new Map(
          tasks.map((task) => [
            String(task.event),
            {
              id: String(task.event),
              title: task.event_title ?? "Sin actividad",
              course: task.event_course ?? "",
            },
          ]),
        ).values(),
      ),
    [tasks],
  );

  const hasFilters = activityFilter !== "all" || statusFilter !== "all";

  const filteredTasks = tasks
    .filter((task) => task.status !== "completed")
    .filter(
      (task) =>
        activityFilter === "all" || String(task.event) === activityFilter,
    )
    .filter((task) => statusFilter === "all" || task.status === statusFilter);

  const overdue = filteredTasks
    .filter((task) => dateAtLocalMidnight(task.scheduled_date) < today)
    .sort(compareTasks);

  const forToday = filteredTasks
    .filter(
      (task) =>
        dateAtLocalMidnight(task.scheduled_date).getTime() === today.getTime(),
    )
    .sort(compareTasks);

  const upcoming = filteredTasks
    .filter((task) => dateAtLocalMidnight(task.scheduled_date) > today)
    .sort(compareTasks);

  const clearFilters = () => {
    setActivityFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="ml-64 min-h-screen p-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-gray-900">Hoy</h1>

            <p className="mt-1 text-sm text-gray-500">
              Tus subtareas se organizan según su fecha programada.
            </p>
          </header>

          {successMessage && (
            <p
              className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </p>
          )}

          {isLoading && (
            <p className="text-sm text-gray-500">Cargando subtareas...</p>
          )}

          {isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              No se pudieron cargar las subtareas.{" "}
              <button
                type="button"
                onClick={() => refetch()}
                className="font-semibold underline"
              >
                Reintentar
              </button>
            </div>
          )}

          {!isLoading && !isError && tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
              <p className="text-gray-600">
                Aún no hay subtareas. Crea primero una actividad para
                planificarlas.
              </p>

              <Link
                href="/actividad"
                className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Crear actividad
              </Link>
            </div>
          )}

          {!isLoading && !isError && tasks.length > 0 && (
            <>
              <section
                className="rounded-xl border border-gray-200 bg-white p-4"
                aria-label="Filtros de subtareas"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
                    Actividad o curso
                    <select
                      value={activityFilter}
                      onChange={(event) =>
                        setActivityFilter(event.target.value)
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">
                        Todas las actividades y cursos
                      </option>

                      {activities.map((activity) => (
                        <option key={activity.id} value={activity.id}>
                          {activity.title}
                          {activity.course ? ` — ${activity.course}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-gray-700">
                    Estado
                    <select
                      value={statusFilter}
                      onChange={(event) =>
                        setStatusFilter(
                          event.target.value as "all" | TaskStatus,
                        )
                      }
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">Todos los estados</option>

                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasFilters}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </section>

              {filteredTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                  <p className="text-gray-600">
                    No hay subtareas para estos filtros
                  </p>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <>
                  <TaskGroup
                    title="Vencidas"
                    tasks={overdue}
                    urgency="overdue"
                    onReschedule={setSelectedTask}
                  />

                  <TaskGroup
                    title="Para hoy"
                    tasks={forToday}
                    urgency="today"
                    onReschedule={setSelectedTask}
                  />

                  <TaskGroup
                    title="Próximas"
                    tasks={upcoming}
                    onReschedule={setSelectedTask}
                  />
                </>
              )}
            </>
          )}
        </div>
      </main>

      <RescheduleModal
        key={`${selectedTask?.id ?? "none"}-${!!selectedTask}`}
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onSuccess={() => {
          setSuccessMessage("Fecha actualizada");
          refetch();
        }}
      />
    </div>
  );
}
