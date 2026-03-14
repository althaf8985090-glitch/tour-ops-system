"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useGuideRosters } from "../../hooks/useManifestData";
import { useState } from "react";

// Page shown to guides for managing rosters.
// This is currently a placeholder and can be extended to show
// roster-specific filters, status indicators and edit actions.
export default function RostersPage() {
  const { data: session } = useSession();
  const { rosters, loading } = useGuideRosters(session?.user?.id);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCompleteRoster = async (rosterId: string) => {
    setActionLoading(rosterId);
    try {
      const res = await fetch("/api/roster/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterId }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to complete roster");
      }
    } catch {
      alert("Failed to complete roster");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestPayment = async (rosterId: string) => {
    setActionLoading(rosterId);
    try {
      const res = await fetch("/api/roster/request-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rosterId }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to request payment");
      }
    } catch {
      alert("Failed to request payment");
    } finally {
      setActionLoading(null);
    }
  };

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
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm bg-emerald-50 text-[#022c22]"
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
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[#022c22] hover:bg-emerald-50"
            >
              <span>All bookings</span>
            </Link>
          </nav>
        </aside>

        <main className="flex-1">
          <h1 className="text-xl font-semibold">Rosters</h1>
          <p className="mt-1 text-sm text-zinc-600">
            View and manage your completed tour rosters.
          </p>

          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">Tour</th>
                    <th className="text-left font-medium px-4 py-2">Date</th>
                    <th className="text-left font-medium px-4 py-2">
                      Participants
                    </th>
                    <th className="text-left font-medium px-4 py-2">Status</th>
                    <th className="text-left font-medium px-4 py-2">Payment</th>
                    <th className="text-left font-medium px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/20">
                  {rosters.map((roster) => (
                    <tr key={roster._id} className="text-[#022c22]">
                      <td className="px-4 py-2 font-medium">
                        {roster.tourId?.title || "Unknown Tour"}
                      </td>
                      <td className="px-4 py-2">
                        {roster.scheduleId?.startTime
                          ? dayjs(roster.scheduleId.startTime).format(
                              "MMM D, YYYY",
                            )
                          : "Unknown"}
                      </td>
                      <td className="px-4 py-2">
                        {roster.participantIds?.length || 0} participants
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                            roster.status === "COMPLETED"
                              ? "bg-emerald-100 text-[#022c22]"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {roster.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                            roster.paymentStatus === "REQUESTED"
                              ? "bg-blue-100 text-blue-700"
                              : roster.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-[#022c22]"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {roster.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-2">
                          {roster.status === "ACTIVE" && (
                            <button
                              type="button"
                              onClick={() => handleCompleteRoster(roster._id)}
                              disabled={actionLoading === roster._id}
                              className="rounded px-2 py-1 text-[11px] bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60"
                            >
                              {actionLoading === roster._id
                                ? "..."
                                : "Complete"}
                            </button>
                          )}
                          {roster.status === "COMPLETED" &&
                            roster.paymentStatus === "PENDING" && (
                              <button
                                type="button"
                                onClick={() => handleRequestPayment(roster._id)}
                                disabled={actionLoading === roster._id}
                                className="rounded px-2 py-1 text-[11px] bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
                              >
                                {actionLoading === roster._id
                                  ? "..."
                                  : "Request Payment"}
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {rosters.length === 0 && !loading ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-zinc-600"
                        colSpan={6}
                      >
                        No rosters found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {loading && (
              <div className="px-4 py-4 text-center text-zinc-600">
                Loading rosters...
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
