import { NextResponse } from "next/server";

export interface AppError {
  message: string;
  code?: string;
  status: number;
}

export function createError(message: string, status = 400, code?: string): AppError {
  return { message, status, code };
}

export function handleApiError(err: unknown): NextResponse {
  if (err instanceof Error) {
    console.error("[api-error]", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
  const appErr = err as AppError;
  if (appErr?.status) {
    return NextResponse.json({ error: appErr.message }, { status: appErr.status });
  }
  console.error("[api-error]", err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function notFound(resource = "Resource") {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}
