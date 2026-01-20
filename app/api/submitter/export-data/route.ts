import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * POST /api/submitter/export-data
 * Export all data for a submitter (GDPR data portability)
 * Requires a valid magic link token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Call Convex to export data
    const result = await convex.query(api.submitterPortal.exportSubmitterData, {
      token,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Export failed" },
        { status: 400 }
      );
    }

    // Return JSON data with proper headers for download
    return new NextResponse(JSON.stringify(result.data, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="feedbackflow_data_export_${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting submitter data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/submitter/export-data
 * Preview export data (returns JSON instead of download)
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

    // Call Convex to export data
    const result = await convex.query(api.submitterPortal.exportSubmitterData, {
      token,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Export failed" },
        { status: 400 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error exporting submitter data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
