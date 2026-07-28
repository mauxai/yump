import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "fallback-secret-change-me",
);

const ALGORITHM  = "HS256";
const EXPIRES_IN = "7d";

export interface JWTPayload {
  sub:   string;        // user/admin id
  email: string;
  name:  string | null;
  kind:  "user" | "admin";
  role?: "admin" | "superadmin";
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub:   payload.sub as string,
      email: payload.email as string,
      name:  (payload.name as string) ?? null,
      kind:  payload.kind as "user" | "admin",
      role:  payload.role as "admin" | "superadmin" | undefined,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") ?? "";
  if (header.startsWith("Bearer ")) return header.slice(7).trim();
  return null;
}
