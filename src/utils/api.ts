// API utility functions
import { ApiResponse } from "@/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function createApiResponse<T>(
  data?: T,
  message?: string,
  success: boolean = true,
): ApiResponse<T> {
  return {
    success,
    data,
    message,
  };
}

export function createApiError(error: string, message?: string): ApiResponse {
  return {
    success: false,
    error,
    message,
  };
}

export async function handleApiError(error: unknown): Promise<Response> {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return Response.json(createApiError(error.message, error.code), {
      status: error.status,
    });
  }

  return Response.json(createApiError("Internal server error"), {
    status: 500,
  });
}


