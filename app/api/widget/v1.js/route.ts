import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET() {
  try {
    const widgetPath = join(process.cwd(), "public", "widget.js");
    const widgetContent = await readFile(widgetPath, "utf-8");

    return new NextResponse(widgetContent, {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error serving widget:", error);
    return new NextResponse("Widget not found", { status: 404 });
  }
}
