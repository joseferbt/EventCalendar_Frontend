"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Rocket, ShieldCheck } from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { RegisterForm } from "./RegisterForm";

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, "El usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();

  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  //Modal Registro
  const [showRegister, setShowRegister] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);

    try {
      console.log("1. Datos del formulario:", values);

      await login(values);

      console.log("2. Login exitoso");
      console.log(
        "3. Access token:",
        localStorage.getItem("access_token") ? "Existe" : "NO existe",
      );

      console.log("4. Redirigiendo a /hoy");

      router.push("/hoy");
    } catch (error) {
      console.error("Error de login:", error);

      setServerError("Credenciales inválidas. Por favor verifica tus datos");

      setTimeout(() => {
        setServerError(null);
      }, 4000);
    }
  };

  // Login rápido utilizando el usuario demo real de Django.
  const handleDemoLogin = async () => {
    // Limpiamos cualquier error anterior.
    setServerError(null);

    try {
      // Utilizamos el mismo sistema de autenticación
      // que utiliza el formulario de login tradicional.
      //
      // Esto hará:
      //
      // POST /api/v1/auth/login/
      //
      // Django devolverá un JWT real.
      await login({
        username: "demo",
        password: "Demo1234",
      });

      // AuthContext se encarga automáticamente de guardar:
      //
      // access_token
      // refresh_token
      //
      // Por eso aquí NO guardamos ningún token manualmente.

      router.push("/hoy");
    } catch (error) {
      // Si Django rechaza el login, mostramos el error.
      console.error("Error en login demo:", error);

      setServerError("No se pudo iniciar la sesión demo.");
    }
  };

  return (
    <>
      {/* Alerta flotante fija en la esquina superior derecha */}
      {serverError && (
        <div className="fixed top-5 right-5 z-[100] w-[360px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 shadow-lg">
          <p className="text-sm font-medium text-red-700">{serverError}</p>
        </div>
      )}
      {/* Contenedor principal de la vista */}
      <div className="min-h-screen bg-[#faf8ff] font-sans text-[#131b2e] flex flex-col justify-center items-center">
        <main className="w-full flex-1 flex flex-col justify-center items-center px-4 md:px-6 py-8">
          <div className="flex flex-col w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* ═══════════════════════════════════════════════════════
                PANEL IZQUIERDO - LOGIN
            ═══════════════════════════════════════════════════════ */}

              <div className="lg:col-span-6 flex flex-col justify-center">
                <div className="bg-white rounded-xl shadow-md p-6 sm:p-8 md:p-12 flex flex-col">
                  {/* Logo */}
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
                      EF
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[18px] font-semibold leading-tight tracking-tight">
                        EventFlow
                      </span>

                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                        Ops & Logistics
                      </span>
                    </div>
                  </div>

                  {/* Título */}
                  <div className="space-y-1 mb-6">
                    <h1 className="text-[28px] font-bold tracking-tight">
                      Bienvenido de vuelta
                    </h1>

                    <p className="text-[14px] text-gray-500">
                      Inicia sesión para gestionar tus eventos y proteger tu
                      capacidad operativa hoy.
                    </p>
                  </div>

                  {/* Error del servidor */}
                  {serverError && (
                    <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-600">{serverError}</p>
                    </div>
                  )}

                  {/* Botón demo */}
                  <button
                    onClick={handleDemoLogin}
                    type="button"
                    className="w-full h-12 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors duration-150 flex items-center justify-center gap-2 text-[14px] font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    <span className="w-5 h-5" />
                    <span>Ingresar como Usuario Demo</span>
                  </button>

                  {/* Separador */}
                  <div className="relative my-6 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full bg-gray-200 h-[1px]" />
                    </div>

                    <span className="relative px-2 bg-white text-[13px] font-semibold text-gray-400 uppercase tracking-wider">
                      o con tu usuario
                    </span>
                  </div>

                  {/* Formulario */}
                  <form
                    className="space-y-4"
                    onSubmit={handleSubmit(onSubmit)}
                    noValidate
                  >
                    {/* Usuario */}
                    <div className="space-y-1">
                      <label
                        className="block text-[13px] font-semibold"
                        htmlFor="login-username"
                      >
                        Usuario
                      </label>

                      <input
                        className={`w-full h-11 px-3 rounded-lg bg-gray-50 border text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.username ? "border-red-400" : "border-gray-200"
                        }`}
                        id="login-username"
                        type="text"
                        placeholder="tu_usuario"
                        autoComplete="username"
                        aria-invalid={!!errors.username}
                        {...register("username")}
                      />

                      {errors.username && (
                        <p className="text-xs text-red-500">
                          {errors.username.message}
                        </p>
                      )}
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1">
                      <label
                        className="block text-[13px] font-semibold"
                        htmlFor="login-password"
                      >
                        Contraseña
                      </label>

                      <div className="relative">
                        <input
                          className={`w-full h-11 pl-3 pr-10 rounded-lg bg-gray-50 border text-[14px] focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.password
                              ? "border-red-400"
                              : "border-gray-200"
                          }`}
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          aria-invalid={!!errors.password}
                          {...register("password")}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={
                            showPassword
                              ? "Ocultar contraseña"
                              : "Mostrar contraseña"
                          }
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {errors.password && (
                        <p className="text-xs text-red-500">
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Botón login */}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-[#131b2e] text-[14px] font-semibold flex items-center justify-center gap-1 transition-all duration-150 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <span>
                        {isSubmitting
                          ? "Ingresando..."
                          : "Iniciar Sesión Tradicional"}
                      </span>
                    </button>
                  </form>

                  {/* Registro */}
                  <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                      ¿No tienes cuenta?{" "}
                      <a
                        type="button"
                        onClick={() => setShowRegister(true)}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        Regístrate
                      </a>
                    </p>
                  </div>

                  {/* Estado */}
                  <div className="mt-8 pt-2 flex items-center justify-center gap-1 text-gray-400 text-[11px] font-bold">
                    <ShieldCheck className="w-4 h-4 text-green-600" />

                    <span>
                      Modo Evaluación Activo • Acceso Rápido Habilitado
                    </span>
                  </div>
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════
                PANEL DERECHO - VISUAL
            ═══════════════════════════════════════════════════════ */}

              <div className="lg:col-span-6 flex flex-col justify-between rounded-xl bg-gradient-to-br from-[#eaedff] to-[#dae2fd] p-6 sm:p-8 lg:p-12 relative overflow-hidden shadow-sm">
                <div className="relative z-10 space-y-4">
                  {/* Badge */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full bg-white text-[11px] font-bold text-indigo-600 tracking-wide uppercase shadow-sm inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
                      Enfoque Operativo Sostenible
                    </span>
                  </div>

                  {/* Capacidad */}
                  <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="space-y-0.5">
                        <div className="text-[18px] font-semibold">
                          Control de Capacidad Diaria
                        </div>

                        <div className="text-[12px] text-gray-500">
                          Carga de trabajo en tiempo real
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center pt-1">
                      <div className="col-span-5 flex flex-col">
                        <span className="text-[30px] font-bold text-indigo-600 leading-none">
                          4.0h
                          <span className="text-[22px] text-gray-400">
                            /6.0h
                          </span>
                        </span>
                      </div>

                      <div className="col-span-7">
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: "66%" }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Testimonio */}
                <div className="relative z-10 mt-8 bg-white/80 backdrop-blur-md rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-full bg-indigo-100 flex-shrink-0 border-2 border-indigo-200 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      EM
                    </div>

                    <div className="space-y-1">
                      <blockquote className="text-[14px] italic text-gray-700">
                        EventFlow cambió por completo cómo organizo mis eventos.
                        Ahora nunca me sobrecargo de horas.
                      </blockquote>
                    </div>
                  </div>
                </div>
              </div>

              {showRegister && (
                <RegisterForm onClose={() => setShowRegister(false)} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
