import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { connectDB } from "../../../database/connection";
import User from "../../../models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email })
    .select("firstName lastName name email phone role")
    .lean<{ firstName?: string; lastName?: string; name?: string; email: string; phone?: string; role: string }>();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const nameFromName = user.name ?? "";
  const parts = nameFromName.trim().split(" ").filter(Boolean);
  const derivedFirst = parts[0] ?? "";
  const derivedLast = parts.slice(1).join(" ");

  return NextResponse.json({
    user: {
      ...user,
      firstName: user.firstName ?? derivedFirst,
      lastName: user.lastName ?? derivedLast,
    },
  });
}

type UpdateBody = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: UpdateBody;
  try {
    body = (await req.json()) as UpdateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await connectDB();

  const user = await User.findOne({ email: session.user.email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (typeof body.firstName === "string") {
    user.firstName = body.firstName;
  }
  if (typeof body.lastName === "string") {
    user.lastName = body.lastName;
  }
  if (typeof body.phone === "string") {
    user.phone = body.phone;
  }
  if (user.firstName || user.lastName) {
    user.name = [user.firstName, user.lastName].filter(Boolean).join(" ");
  }

  await user.save();

  return NextResponse.json({
    ok: true,
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
}

