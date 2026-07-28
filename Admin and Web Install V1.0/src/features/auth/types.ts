export interface LoginCredentials {
  email:    string;
  password: string;
  kind?:    "user" | "admin";
}

export interface RegisterData {
  name:     string;
  email:    string;
  password: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token:    string;
  password: string;
}

export interface AuthSession {
  user: {
    id:    string;
    email: string;
    name:  string | null;
    kind:  "user" | "admin";
    role?: "admin" | "superadmin";
  };
}
