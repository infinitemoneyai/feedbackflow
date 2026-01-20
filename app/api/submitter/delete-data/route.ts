import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/submitter/delete-data
 * Request deletion of submitter's personal data (GDPR right to erasure)
 * Requires a valid magic link token and confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, confirmDeletion } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    if (!confirmDeletion) {
      return NextResponse.json(
        { error: "You must confirm the deletion request by setting confirmDeletion to true" },
        { status: 400 }
      );
    }

    // Call Convex to delete data
    const result = await convex.mutation(api.submitterPortal.requestDataDeletion, {
      token,
      confirmDeletion: true,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error deleting submitter data:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete data";
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}

/**
 * GET /api/submitter/delete-data
 * Check if data can be deleted (for UI)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Call Convex to check deletion status
    const result = await convex.query(api.submitterPortal.canDeleteData, {
      token,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking deletion status:", error);
    return NextResponse.json(
      { error: "Failed to check deletion status" },
      { status: 500 }
    );
  }
}
