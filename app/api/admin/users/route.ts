import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { connectDB } from "../../../../database/connection";
import User from "../../../../models/User";
import { hashPassword } from "../../../../lib/password";

type CreateUserBody = {
  email: string;
  password: string;
  name?: string;
  role: "guide" | "admin";
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: CreateUserBody;
  try {
    body = (await req.json()) as CreateUserBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";
  const role = body.role;
  const name = body.name?.trim() || (role === "guide" ? "Guide" : "Admin");

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 },
    );
  }
  if (role !== "guide" && role !== "admin") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  await connectDB();
  const passwordHash = await hashPassword(password);

  const created = await User.create({ email, name, role, passwordHash });
  return NextResponse.json({
    ok: true,
    user: { id: String(created._id), email: created.email, role: created.role },
  });
}

