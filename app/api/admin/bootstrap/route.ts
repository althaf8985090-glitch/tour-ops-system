import { NextResponse } from "next/server";
import { connectDB } from "../../../../database/connection";
import User from "../../../../models/User";
import { hashPassword } from "../../../../lib/password";

type BootstrapBody = {
  email: string;
  password: string;
  name?: string;
};

export async function POST(req: Request) {
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  const provided = req.headers.get("x-setup-secret") ?? "";

  if (!setupSecret || provided !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: BootstrapBody;
  try {
    body = (await req.json()) as BootstrapBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim();
  const password = body.password ?? "";
  const name = body.name?.trim() || "Admin";

  if (!email || !password) {
    return NextResponse.json(
      { error: "email and password are required" },
      { status: 400 },
    );
  }

  await connectDB();

  const existingAdmin = await User.findOne({ email, role: "admin" }).lean();
  if (existingAdmin) {
    return NextResponse.json({ ok: true, alreadyExists: true });
  }

  const passwordHash = await hashPassword(password);

  await User.findOneAndUpdate(
    { email },
    { $set: { email, name, role: "admin", passwordHash } },
    { upsert: true, new: true },
  );

  return NextResponse.json({ ok: true, created: true });
}

