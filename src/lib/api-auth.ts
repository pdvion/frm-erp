/**
 * API Key Authentication for REST API v1
 * VIO-1123 — Public REST API
 *
 * Key format: frm_<32 random hex chars> (total 36 chars)
 * Storage: SHA-256 hash in DB, prefix (frm_xxxx) for display
 */

import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimitCustom } from "@/lib/rate-limit";
import { RateLimitError } from "@/lib/errors";
import type { ApiKeyPermission } from "@prisma/client";

const API_KEY_PREFIX = "frm_";
const API_KEY_RANDOM_BYTES = 16; // 32 hex chars

export interface ApiContext {
  companyId: string;
  apiKeyId: string;
  permissions: ApiKeyPermission[];
}

/**
 * Generate a new API key
 * @returns { key: plaintext key (show once), keyHash, keyPrefix }
 */
export function generateApiKey(): {
  key: string;
  keyHash: string;
  keyPrefix: string;
  } {
  const randomPart = randomBytes(API_KEY_RANDOM_BYTES).toString("hex");
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = hashApiKey(key);
  const keyPrefix = key.substring(0, 12); // "frm_xxxxxxxx"
  return { key, keyHash, keyPrefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Check if permissions include the required permission
 */
function hasPermission(
  granted: ApiKeyPermission[],
  required: ApiKeyPermission
): boolean {
  return granted.includes("ALL") || granted.includes(required);
}

/**
 * Authenticate a request using API key from Authorization header
 * Returns ApiContext or a NextResponse error
 */
export async function authenticateApiKey(
  request: NextRequest,
  requiredPermission: ApiKeyPermission
): Promise<ApiContext | NextResponse> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer frm_..." },
      { status: 401 }
    );
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return NextResponse.json(
      { error: "Invalid Authorization format. Use: Bearer <api_key>" },
      { status: 401 }
    );
  }

  const key = parts[1];
  if (!key.startsWith(API_KEY_PREFIX)) {
    return NextResponse.json(
      { error: "Invalid API key format" },
      { status: 401 }
    );
  }

  // Rate limit by key prefix (before DB lookup)
  try {
    checkRateLimitCustom(key.substring(0, 12), "api_v1", {
      limit: 120,
      windowSeconds: 60,
    });
  } catch (e: unknown) {
    if (e instanceof RateLimitError) {
      return NextResponse.json(
        { error: e.message },
        {
          status: 429,
          headers: {
            "Retry-After": String(e.retryAfter),
            "X-RateLimit-Limit": "120",
          },
        }
      );
    }
    throw e;
  }

  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash },
    select: {
      id: true,
      companyId: true,
      permissions: true,
      isActive: true,
      expiresAt: true,
    },
  });

  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  if (!apiKey.isActive) {
    return NextResponse.json(
      { error: "API key has been revoked" },
      { status: 401 }
    );
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "API key has expired" },
      { status: 401 }
    );
  }

  if (!hasPermission(apiKey.permissions, requiredPermission)) {
    return NextResponse.json(
      {
        error: `Insufficient permissions. Required: ${requiredPermission}`,
      },
      { status: 403 }
    );
  }

  // Update lastUsedAt (fire-and-forget)
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Ignore errors on lastUsedAt update
    });

  return {
    companyId: apiKey.companyId,
    apiKeyId: apiKey.id,
    permissions: apiKey.permissions,
  };
}

/**
 * Helper: Check if result is an error response
 */
export function isErrorResponse(
  result: ApiContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Standard pagination params from query string
 */
export function parsePagination(searchParams: URLSearchParams): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Standard pagination response
 */
export function paginationMeta(
  total: number,
  page: number,
  limit: number
): {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

/**
 * Standard CORS headers for API responses
 */
export function apiHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Content-Type": "application/json",
  };
}

/**
 * Handle OPTIONS preflight
 */
export function handleOptions(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: apiHeaders(),
  });
}
