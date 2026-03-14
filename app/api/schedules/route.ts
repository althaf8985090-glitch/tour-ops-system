import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../database/connection";
import Schedule from "../../../models/Schedule";
import Booking from "../../../models/Booking";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tourId = searchParams.get("tourId");

    await connectDB();

    const filter: Record<string, unknown> = {};
    if (tourId) {
      if (!mongoose.isValidObjectId(tourId)) {
        return NextResponse.json({ error: "Invalid tourId" }, { status: 400 });
      }
      filter.tourId = new mongoose.Types.ObjectId(tourId);
    }

    const schedules = await Schedule.find(filter)
      .populate({ path: "tourId", select: { title: 1 } })
      .select({ startTime: 1, endTime: 1, capacity: 1, tourId: 1, guideIds: 1 })
      .sort({ startTime: 1 })
      .lean();

    if (schedules.length === 0) {
      return NextResponse.json({ schedules: [] });
    }

    // For each schedule, count bookings so we can prefer schedules that have data.
    const counts = await Promise.all(
      schedules.map((s) =>
        Booking.countDocuments({ schedule: (s as { _id: mongoose.Types.ObjectId })._id }),
      ),
    );

    // Dedupe by (tourId, startTime): keep one schedule per slot, preferring the one with most bookings.
    const byKey = new Map<
      string,
      { s: (typeof schedules)[0]; count: number }
    >();
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i] as (typeof schedules)[0] & { _id: mongoose.Types.ObjectId; tourId?: { _id: mongoose.Types.ObjectId; title?: string } };
      const tid = String(s.tourId?._id ?? s.tourId);
      const key = `${tid}-${s.startTime?.getTime() ?? 0}`;
      const count = counts[i] ?? 0;
      const existing = byKey.get(key);
      if (!existing || count > existing.count) {
        byKey.set(key, { s, count });
      }
    }

    const deduped = Array.from(byKey.values()).map(({ s }) => s);

    const formatted = deduped.map((s) => {
      const t = s.tourId as { _id?: mongoose.Types.ObjectId; title?: string } | undefined;
      return {
        ...s,
        tourId: String(t?._id ?? s.tourId),
        tourTitle: t?.title ?? "",
      };
    });

    return NextResponse.json({ schedules: formatted });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to load schedules",
      },
      { status: 500 },
    );
  }
}
