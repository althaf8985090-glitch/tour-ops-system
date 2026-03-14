"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

// Placeholder page listing all bookings. In future this may be a searchable
// and filterable table with booking detail actions.
export default function BookingsPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl px-6 py-6 gap-6 text-[#022c22]">
        <aside className="hidden w-56 flex-shrink-0 flex-col rounded-2xl border border-emerald-500/30 bg-white p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] md:flex">
          <div className="flex items-center gap-3 pb-4 border-b border-emerald-500/20">
            <Link href="/profile" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
                {(session?.user?.name || session?.user?.email || "G")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold">
                  {session?.user?.name || "Guide"}
                </div>
                <div className="text-xs text-zinc-500">
                  {session?.user?.role === "admin" ? "Admin" : "Guide"}
                </div>
              </div>
            </Link>
          </div>

          <nav className="mt-4 space-y-1 text-sm">
            <Link
              href="/rosters"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#022c22] hover:bg-emerald-50"
            >
              <span>Rosters</span>
            </Link>
            <Link
              href="/manifest"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#022c22] hover:bg-emerald-50"
            >
              <span>Manifest</span>
            </Link>
            <Link
              href="/waiting-room"
              className="mt-2 flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#022c22] hover:bg-emerald-50"
            >
              <span>Waiting room</span>
            </Link>
            <Link
              href="/bookings"
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm bg-emerald-50 text-[#022c22]"
            >
              <span>All bookings</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1">
          <h1 className="text-xl font-semibold">All Bookings</h1>
          <p className="mt-1 text-sm text-zinc-600">
            This is a placeholder All Bookings page. Navigation is wired; we
            will add full functionality later.
          </p>
        </main>
      </div>
    </div>
  );
}

