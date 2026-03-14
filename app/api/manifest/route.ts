// API route for fetching the manifest for a selected schedule.
//
// Expected query parameters:
// - scheduleId: database ObjectId of the schedule
//
// This endpoint uses `getManifest` to build a summary response for the UI.
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../database/connection";
import { getManifest } from "../../../services/manifestService";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("scheduleId") ?? "";

    await connectDB();
    const manifest = await getManifest({
      scheduleId,
      guideId: session.user.id,
      isAdmin: session.user.role === "admin",
    });

    return NextResponse.json(manifest);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to load manifest";
    const status =
      message.toLowerCase().includes("invalid") ||
      message.toLowerCase().includes("not found")
        ? 400
        : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
