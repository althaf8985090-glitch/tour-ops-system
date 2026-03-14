import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "../../../../database/connection";
import User from "../../../../models/User";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
    };

    const email = body.email;
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, reason: "Missing email or password" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select(
      "+passwordHash name email role phone",
    );

    if (!user?.passwordHash) {
      return NextResponse.json(
        { ok: false, reason: "User not found or no passwordHash" },
        { status: 404 },
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);

    return NextResponse.json(
      {
        ok,
        reason: ok ? "Password matches" : "Password does NOT match stored hash",
        user: {
          id: String(user._id),
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
      { status: ok ? 200 : 401 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("test-login error", message, err);
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}

