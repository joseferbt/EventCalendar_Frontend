"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRescheduleTask } from "../hooks/useTasks";
import type { DailyOverloadConflictError } from "../types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const rescheduleSchema = z.object({
  scheduled_date: z.string().min(1, "La nueva fecha es requerida"),
  estimated_hours: z.coerce
    .number()
    .min(0.5, "Las horas estimadas deben ser al menos 0.5")
    .max(24, "Horas estimadas inválidas"),
  reason: z.string().optional(),
});

type RescheduleFormValues = z.infer<typeof rescheduleSchema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReschedulableTask {
  id: number;
  title: string;
  scheduled_date: string;
  estimated_hours?: number | string;
}

interface RescheduleModalProps {
  task: ReschedulableTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RescheduleModal({ task, open, onOpenChange, onSuccess }: RescheduleModalProps) {
  const { mutateAsync: reschedule, isPending } = useRescheduleTask(task?.id ?? 0);
  const [conflict, setConflict] = useState<DailyOverloadConflictError | null>(null);
  const [genericError, setGenericError] = useState<string | null>(null);

  const defaultHours = task?.estimated_hours ? Number(task.estimated_hours) : 2;

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    formState: { errors },
  } = useForm<RescheduleFormValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      scheduled_date: task?.scheduled_date ?? "",
      estimated_hours: defaultHours,
      reason: "Reprogramación de tarea",
    },
  });

  const handleClose = () => {
    setConflict(null);
    setGenericError(null);
    onOpenChange(false);
  };

  const onSubmit = async (values: RescheduleFormValues) => {
    if (!task) return;
    setConflict(null);
    setGenericError(null);

    try {
      await reschedule({
        new_date: values.scheduled_date,
        new_hours: values.estimated_hours,
        reason: values.reason || "Reprogramación de tarea",
      });
      onSuccess?.();
      reset();
      handleClose();
    } catch (err: unknown) {
      // Los datos ingresados se conservan en el formulario mientras se resuelve el conflicto.
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        const errorData = err.response.data as DailyOverloadConflictError;
        setConflict(errorData);
      } else if (axios.isAxiosError(err) && err.response?.data?.detail) {
        const detail = err.response.data.detail;
        setGenericError(typeof detail === "string" ? detail : "Error al reprogramar la subtarea");
      } else {
        setGenericError("No se pudo reprogramar. Verifica los datos e inténtalo de nuevo.");
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose();
        } else {
          onOpenChange(true);
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Reprogramar subtarea
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {task?.title ? `"${task.title}"` : "Subtarea"} — Ajusta la fecha y horas planificadas
          </DialogDescription>
        </DialogHeader>

        {/* ALERTA DE SOBRECARGA (DOD) */}
        {conflict && (
          <div
            id="overload-alert"
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-red-300 bg-red-50 p-4 shadow-xs space-y-3 animate-in fade-in-50"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-base">
                ⚠️
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-red-900 text-sm">
                    Conflicto de Sobrecarga Diaria
                  </h4>
                  <span className="rounded-full bg-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-800">
                    Límite excedido
                  </span>
                </div>
                <p className="text-xs text-red-800 font-medium leading-relaxed">
                  {conflict.detail}
                </p>
              </div>
            </div>

            {/* Métricas de horas */}
            <div className="grid grid-cols-3 gap-2 rounded-lg bg-white/90 p-2.5 text-center text-xs border border-red-200">
              <div>
                <span className="block text-[11px] text-gray-500 font-medium">Horas actuales</span>
                <span className="text-sm font-bold text-gray-800">{conflict.current_hours}h</span>
              </div>
              <div>
                <span className="block text-[11px] text-gray-500 font-medium">A reprogramar</span>
                <span className="text-sm font-bold text-amber-700">{conflict.attempted_hours}h</span>
              </div>
              <div>
                <span className="block text-[11px] text-gray-500 font-medium">Límite diario</span>
                <span className="text-sm font-bold text-red-600">{conflict.daily_hour_limit}h</span>
              </div>
            </div>

            {/* Opciones de resolución según DOD: Ajustar horas, Cambiar fecha o Cancelar */}
            <div className="border-t border-red-200 pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <span className="text-red-900 font-medium text-[11px]">
                Opciones para resolver el conflicto:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFocus("estimated_hours")}
                  className="h-7 text-xs border-red-300 bg-white text-red-700 hover:bg-red-100"
                >
                  ✏️ Ajustar horas
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFocus("scheduled_date")}
                  className="h-7 text-xs border-red-300 bg-white text-red-700 hover:bg-red-100"
                >
                  📅 Cambiar fecha
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-7 text-xs text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}

        {genericError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium"
          >
            {genericError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campo Nueva fecha */}
            <div className="space-y-1">
              <Label htmlFor="reschedule-date" className="text-xs font-semibold text-gray-700">
                Nueva fecha *
              </Label>
              <Input
                id="reschedule-date"
                type="date"
                aria-invalid={!!errors.scheduled_date}
                className={`text-sm ${conflict ? "border-amber-400 bg-amber-50/20" : ""}`}
                {...register("scheduled_date")}
              />
              {errors.scheduled_date && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.scheduled_date.message}
                </p>
              )}
            </div>

            {/* Campo Horas estimadas */}
            <div className="space-y-1">
              <Label htmlFor="reschedule-hours" className="text-xs font-semibold text-gray-700">
                Horas estimadas *
              </Label>
              <Input
                id="reschedule-hours"
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                aria-invalid={!!errors.estimated_hours}
                className={`text-sm ${conflict ? "border-amber-400 bg-amber-50/20" : ""}`}
                {...register("estimated_hours")}
              />
              {errors.estimated_hours && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.estimated_hours.message}
                </p>
              )}
            </div>
          </div>

          {/* Campo Motivo de reprogramación */}
          <div className="space-y-1">
            <Label htmlFor="reschedule-reason" className="text-xs font-semibold text-gray-700">
              Motivo de reprogramación
            </Label>
            <Input
              id="reschedule-reason"
              placeholder="Ej. Cambio de cronograma, ajuste de disponibilidad..."
              className="text-sm"
              {...register("reason")}
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className={conflict ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
            >
              {isPending
                ? "Guardando..."
                : conflict
                ? "Reintentar reprogramación"
                : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
