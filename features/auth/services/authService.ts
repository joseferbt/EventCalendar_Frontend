import apiClient from "@/lib/axios";
import type {
  AuthTokens,
  LoginPayload,
  RegisterPayload,
  User,
  RegisterResponse,
} from "../types";

/**POST /api/v1/auth/login/ — obtiene access + refresh tokens */
export async function loginUser(payload: LoginPayload): Promise<AuthTokens> {
  const { data } = await apiClient.post<AuthTokens>("/auth/login/", payload);
  return data;
}

/** POST /auth/register/ — crea un nuevo usuario */
export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>(
    "/auth/register/",
    payload,
  );

  return data;
}

/** POST /auth/token/refresh/ — renueva el access token */
export async function refreshToken(
  refresh: string,
): Promise<Pick<AuthTokens, "access">> {
  const { data } = await apiClient.post<Pick<AuthTokens, "access">>(
    "/auth/token/refresh/",
    { refresh },
  );
  return data;
}

/** GET /auth/me/ — obtiene el usuario autenticado actual */
export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>("/auth/profile/");
  return data;
}
