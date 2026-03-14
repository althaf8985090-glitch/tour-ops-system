import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../database/connection";
import { checkInParticipant } from "../../../services/checkinService";

type Body = {
  participantId: string;
  scheduleId: string;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const { participantId, scheduleId } = body;

    await connectDB();

    await checkInParticipant({
      participantId,
      scheduleId,
      guideId: session.user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to check in",
      },
      { status: 500 },
    );
  }
}
