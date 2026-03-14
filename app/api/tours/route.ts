import { NextResponse } from "next/server";
import { connectDB } from "../../../database/connection";
import Tour from "../../../models/Tour";

export async function GET() {
  try {
    await connectDB();
    const docs = await Tour.find({})
      .select({ title: 1 })
      .sort({ title: 1 })
      .lean();

    const seen = new Set<string>();
    const tours = docs.filter((t) => {
      const title = (t as { title?: string }).title ?? "";
      if (!title) return false;
      if (seen.has(title)) return false;
      seen.add(title);
      return true;
    });

    return NextResponse.json({ tours });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load tours" },
      { status: 500 },
    );
  }
}

