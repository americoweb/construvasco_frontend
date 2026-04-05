import { Tenant } from "app/core/models/common.types";
import { User } from "./user.interface";

export interface LoginCredentials {
  identifier: string; // email or whatsapp
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  name: string;
  identifier: string;
  type: 'email' | 'whatsapp';
  password: string;
  password_confirmation: string;
  organization_name?: string; // Optional - all users default to tenant_id 1
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  user: User;
  current_tenant?: Tenant;
  must_change?: boolean;
  message?: string;
}

export interface TokenPayload {
  sub: string; // user id
  iat: number; // issued at
  exp: number; // expires at
  tenant_id?: string;
  permissions?: string[];
}

export interface ForgotPasswordRequest {
  identifier: string;
  type: 'email' | 'whatsapp';
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
}
