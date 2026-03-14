import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../database/connection";
import Roster from "../../../models/Roster";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const guideId = searchParams.get("guideId");

    if (
      guideId &&
      guideId !== session.user.id &&
      session.user.role !== "admin"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const queryGuideId = guideId || session.user.id;

    await connectDB();

    const rosters = await Roster.find({
      guideIds: queryGuideId,
    })
      .populate("tourId", "title")
      .populate("scheduleId", "startTime")
      .populate("participantIds", "name")
      .sort({ createdAt: -1 });

    return NextResponse.json({ rosters });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to fetch rosters",
      },
      { status: 500 },
    );
  }
}
