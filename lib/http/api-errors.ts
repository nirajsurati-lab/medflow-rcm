import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function getValidationDetails(error: ZodError) {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "payload";
    return `${path}: ${issue.message}`;
  });
}

export function invalidPayloadResponse(message: string, error: ZodError) {
  return NextResponse.json(
    {
      error: message,
      details: getValidationDetails(error),
    },
    { status: 400 }
  );
}

function getErrorStatus(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("unauthorized")) {
    return 401;
  }

  if (normalizedMessage.includes("forbidden")) {
    return 403;
  }

  if (normalizedMessage.includes("not found")) {
    return 404;
  }

  if (normalizedMessage.includes("invalid")) {
    return 400;
  }

  return 500;
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  const message =
    error instanceof Error && error.message ? error.message : fallbackMessage;

  return NextResponse.json(
    {
      error: message,
    },
    { status: getErrorStatus(message) }
  );
}
