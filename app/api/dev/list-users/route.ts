import { NextResponse } from "next/server";
import { connectDB } from "../../../../database/connection";
import User from "../../../../models/User";

export async function GET() {
  try {
    await connectDB();
    const users = await User.find({})
      .select("email role name createdAt")
      .limit(50)
      .lean();

    return NextResponse.json({ ok: true, users });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("list-users error", message, err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

