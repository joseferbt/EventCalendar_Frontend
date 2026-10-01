"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { X, AtSign, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import axios from "axios";
import { registerUser } from "../services/authService";

const registerSchema = z
  .object({
    username: z.string().min(3, "Mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    first_name: z.string().min(1, "El nombre es requerido"),
    last_name: z.string().min(1, "El apellido es requerido"),
    password: z.string().min(8, "Mínimo 8 caracteres"),
    password_confirm: z.string().min(1, "Confirma la contraseña"),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirm"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onClose: () => void;
}

export function RegisterForm({ onClose }: RegisterFormProps) {
  const router = useRouter();

  // Error general del servidor.
  // Solo se utiliza para errores que no pertenecen
  // específicamente a un campo.
  const [serverError, setServerError] = useState<string | null>(null);

  // Errores específicos enviados por Django.
  const [serverFieldErrors, setServerFieldErrors] = useState<{
    email?: string;
    username?: string;
    password?: string;
  }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [showpassword_confirm, setShowpassword_confirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    // Limpiar errores anteriores antes de realizar un nuevo intento.
    setServerError(null);
    setServerFieldErrors({});

    try {
      await registerUser(values);

      onClose();

      router.push("/login?registered=true");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data;

        console.log("Error de registro:", data);

        const fieldErrors: {
          email?: string;
          username?: string;
          password?: string;
        } = {};

        // ============================
        // ERRORES ESPECÍFICOS POR CAMPO
        // ============================

        if (data?.email?.[0]) {
          fieldErrors.email = data.email[0];
        }

        if (data?.username?.[0]) {
          fieldErrors.username = data.username[0];
        }

        if (data?.password?.[0]) {
          fieldErrors.password = data.password[0];
        }

        setServerFieldErrors(fieldErrors);

        // ============================
        // ERROR GENERAL
        // ============================

        // Solo mostramos el mensaje superior
        // si NO corresponde a un campo específico.
        if (data?.detail) {
          setServerError(data.detail);
        } else if (
          !data?.email?.[0] &&
          !data?.username?.[0] &&
          !data?.password?.[0]
        ) {
          setServerError(
            "Error al registrar. Verifica los datos e intenta de nuevo.",
          );
        }
      } else {
        setServerError(
          "Error al registrar. Verifica los datos e intenta de nuevo.",
        );
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#131b2e]/30 backdrop-blur-sm px-4 py-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-[620px] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Barra superior */}
        <div className="h-[6px] w-full bg-gradient-to-r from-[#3525CD] via-[#4F46E5] to-[#D3E4FE]" />

        <div className="p-5 sm:p-6">
          {/* ============================
              HEADER
          ============================ */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-1.5 px-3 py-1 rounded-full bg-[#E2DFFF]">
                <span className="text-[12px]">✨</span>

                <span className="text-[11px] font-bold tracking-[0.275px] uppercase text-[#0F0069]">
                  Nueva cuenta de organizador
                </span>
              </div>

              {/* Título */}
              <h2 className="text-[26px] leading-8 font-bold tracking-[-0.5px] text-[#131B2E]">
                Crear Cuenta en EventCalendar
              </h2>

              {/* Descripción */}
              <p className="max-w-[520px] text-[13px] leading-5 text-[#505F76]">
                Ingresa tus datos básicos para acceder a la plataforma y
                comenzar a planificar tus eventos.
              </p>
            </div>

            {/* Cerrar */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar registro"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F3FF] text-[#505F76] hover:bg-[#E8E9FA] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ============================
              ERROR GENERAL
          ============================ */}
          {serverError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs text-red-600">{serverError}</p>
            </div>
          )}

          {/* ============================
              FORMULARIO
          ============================ */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-5 space-y-3"
          >
            {/* ============================
                NOMBRE + APELLIDO
            ============================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              {/* NOMBRE */}
              <div>
                <label
                  htmlFor="reg-first-name"
                  className="block mb-1.5 text-[13px] leading-4 font-semibold tracking-[0.13px] text-[#131B2E]"
                >
                  Nombre
                </label>

                <input
                  id="reg-first-name"
                  type="text"
                  placeholder="Ej. Elena"
                  {...register("first_name")}
                  className={`w-full h-11 px-[14px] rounded-xl bg-[#F2F3FF] text-[14px] text-[#131B2E] placeholder:text-[#505F76]/60 border outline-none transition ${
                    errors.first_name
                      ? "border-red-400"
                      : "border-transparent focus:border-[#4F46E5]"
                  }`}
                />

                {errors.first_name && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              {/* APELLIDO */}
              <div>
                <label
                  htmlFor="reg-last-name"
                  className="block mb-1.5 text-[13px] leading-4 font-semibold tracking-[0.13px] text-[#131B2E]"
                >
                  Apellido
                </label>

                <input
                  id="reg-last-name"
                  type="text"
                  placeholder="Ej. Morales"
                  {...register("last_name")}
                  className={`w-full h-11 px-[14px] rounded-xl bg-[#F2F3FF] text-[14px] text-[#131B2E] placeholder:text-[#505F76]/60 border outline-none transition ${
                    errors.last_name
                      ? "border-red-400"
                      : "border-transparent focus:border-[#4F46E5]"
                  }`}
                />

                {errors.last_name && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            {/* ============================
                USUARIO + CORREO
            ============================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              {/* USUARIO */}
              <div>
                <label
                  htmlFor="reg-username"
                  className="block mb-1.5 text-[13px] leading-4 font-semibold text-[#131B2E]"
                >
                  Nombre de usuario
                </label>

                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#596982]" />

                  <input
                    id="reg-username"
                    type="text"
                    placeholder="demo"
                    autoComplete="username"
                    className={`w-full h-11 pl-10 pr-3 rounded-lg bg-[#EFF3FF] border text-[14px] text-[#131B2E] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.username || serverFieldErrors.username
                        ? "border-red-400"
                        : "border-transparent"
                    }`}
                    {...register("username")}
                  />
                </div>

                {(errors.username || serverFieldErrors.username) && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.username?.message || serverFieldErrors.username}
                  </p>
                )}
              </div>

              {/* CORREO */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block mb-1.5 text-[13px] leading-4 font-semibold text-[#131B2E]"
                >
                  Correo electrónico
                </label>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#596982]" />

                  <input
                    id="reg-email"
                    type="email"
                    placeholder="correo@eventflow.pro"
                    autoComplete="email"
                    className={`w-full h-11 pl-10 pr-3 rounded-lg bg-[#EFF3FF] border text-[14px] text-[#131B2E] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.email || serverFieldErrors.email
                        ? "border-red-400"
                        : "border-transparent"
                    }`}
                    {...register("email")}
                  />
                </div>

                {(errors.email || serverFieldErrors.email) && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.email?.message || serverFieldErrors.email}
                  </p>
                )}
              </div>
            </div>

            {/* ============================
                CONTRASEÑA + CONFIRMAR
            ============================ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              {/* CONTRASEÑA */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block mb-1.5 text-[13px] leading-4 font-semibold text-[#131B2E]"
                >
                  Contraseña
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#596982]" />

                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full h-11 pl-10 pr-14 rounded-lg bg-[#EFF3FF] border text-[14px] text-[#131B2E] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.password || serverFieldErrors.password
                        ? "border-red-400"
                        : "border-transparent"
                    }`}
                    {...register("password")}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#596982] text-sm"
                  >
                    {showPassword ? "Ocultar" : "Ver"}
                  </button>
                </div>

                {(errors.password || serverFieldErrors.password) && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password?.message || serverFieldErrors.password}
                  </p>
                )}
              </div>

              {/* CONFIRMAR CONTRASEÑA */}
              <div>
                <label
                  htmlFor="reg-password-confirm"
                  className="block mb-1.5 text-[13px] leading-4 font-semibold text-[#131B2E]"
                >
                  Confirmar contraseña
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#596982]" />

                  <input
                    id="reg-password-confirm"
                    type={showpassword_confirm ? "text" : "password"}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full h-11 pl-10 pr-14 rounded-lg bg-[#EFF3FF] border text-[14px] text-[#131B2E] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.password_confirm
                        ? "border-red-400"
                        : "border-transparent"
                    }`}
                    {...register("password_confirm")}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowpassword_confirm((previous) => !previous)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#596982] text-sm"
                  >
                    {showpassword_confirm ? "Ocultar" : "Ver"}
                  </button>
                </div>

                {errors.password_confirm && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.password_confirm.message}
                  </p>
                )}
              </div>
            </div>

            {/* ============================
                AVISO DE SEGURIDAD
            ============================
            <div className="flex items-center gap-2.5 px-[14px] py-2.5 rounded-lg bg-[#EAEDFF]">
              <LockKeyhole className="w-4 h-4 shrink-0 text-[#3525CD]" />

              <p className="text-[11px] leading-[15px] font-bold tracking-[0.44px] text-[#505F76]">
                Registro protegido con cifrado SSL 256-bit y cumplimiento RGPD.
              </p>
            </div>*/}

            {/* ============================
                ACCIONES
            ============================ */}
            <div className="pt-2 flex flex-col items-center gap-3">
              {/* Crear cuenta */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold flex items-center justify-center gap-2 shadow-md transition-colors"
              >
                <span>
                  {isSubmitting
                    ? "Creando cuenta..."
                    : "Crear Cuenta y Comenzar"}
                </span>

                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Cancelar */}
              <button
                type="button"
                onClick={onClose}
                className="h-7 px-4 text-[14px] leading-5 text-[#505F76] hover:text-[#131B2E] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>

          {/* ============================
              FOOTER
          ============================ */}
          <div className="mt-5 pt-5 border-t border-[#EAEDFF]">
            <p className="flex items-center justify-center gap-1 text-[14px] leading-5 text-[#505F76]">
              <span>¿Ya tienes una cuenta activa?</span>

              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-[#3525CD] underline hover:text-[#2C20A8]"
              >
                Iniciar sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
