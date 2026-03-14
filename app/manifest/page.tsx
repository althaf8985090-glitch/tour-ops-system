"use client";

import dayjs from "dayjs";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useManifest, useGuideSchedules, useTours } from "../../hooks/useManifestData";

// Page component for the manifest dashboard.
//
// This screen is used by guides (and admins) to:
// - pick a tour and time slot
// - view summary stats (total guests, checked-in, no-show, etc.)
// - view and filter the guest list
// - open the booking summary drawer and perform check-ins
// - export the current manifest as CSV
//
// The UI is intentionally kept lightweight and uses client state/hooks to
// request data from the backend via `useManifest`, `useTours`, and `useSchedules`.
export default function ManifestPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  const { schedules, loading: schedulesLoading } = useGuideSchedules(
    session?.user?.id,
  );

  const { tours } = useTours();

  const [tourId, setTourId] = useState<string>("");
  const [scheduleId, setScheduleId] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);
  const {
    stats,
    guests,
    loading: manifestLoading,
  } = useManifest(scheduleId || undefined, reloadKey);

  const [addGuideOpen, setAddGuideOpen] = useState(false);
  const [guideName, setGuideName] = useState("");
  const [guideEmail, setGuideEmail] = useState("");
  const [guidePassword, setGuidePassword] = useState("");
  const [savingGuide, setSavingGuide] = useState(false);
  const [guideError, setGuideError] = useState<string | null>(null);
  const [guideSuccess, setGuideSuccess] = useState<string | null>(null);
  const [hideCheckedIn, setHideCheckedIn] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryBookingId, setSummaryBookingId] = useState<string | null>(null);
  const [summarySaving, setSummarySaving] = useState(false);

  const tourOptions = useMemo(() => {
    // Dedupe by tour title so the same tour never appears multiple times.
    const byTitle = new Map<string, { id: string; label: string }>();
    for (const s of schedules) {
      const id = String(s.tourId);
      const label = (s.tourTitle || "Untitled tour").trim() || "Untitled tour";
      if (!id) continue;
      if (!byTitle.has(label)) {
        byTitle.set(label, { id, label });
      }
    }
    return Array.from(byTitle.values());
  }, [schedules]);

  const scheduleOptions = useMemo(() => {
    const filtered = tourId
      ? schedules.filter((s) => String(s.tourId) === tourId)
      : schedules;
    // Dedupe by date-time label so the same time never appears multiple times;
    // keep the first scheduleId for each label so manifest loads for that schedule.
    const byLabel = new Map<string, { id: string; value: string; label: string }>();
    for (const s of filtered) {
      const label = dayjs(s.startTime).format("ddd, MMM D, h:mm A");
      if (!byLabel.has(label)) {
        byLabel.set(label, { id: s._id, value: s._id, label });
      }
    }
    return Array.from(byLabel.values());
  }, [schedules, tourId]);

  const visibleGuests = useMemo(
    () =>
      hideCheckedIn ? guests.filter((g) => g.status !== "CHECKED_IN") : guests,
    [guests, hideCheckedIn],
  );

  const summaryBooking = useMemo(() => {
    const base =
      visibleGuests.find((g) => String(g.bookingId) === summaryBookingId) ??
      null;
    return base as
      | (typeof visibleGuests[number] & { primaryParticipantId?: string })
      | null;
  }, [summaryBookingId, visibleGuests]);

  const selectedSchedule = useMemo(
    () => schedules.find((s) => s._id === scheduleId) ?? null,
    [schedules, scheduleId],
  );

  const guideDisplayName =
    session?.user?.name || session?.user?.email || "Guide";

  function handleExportCsv() {
    if (!scheduleId || guests.length === 0) return;

    const selectedSchedule = schedules.find((s) => s._id === scheduleId);
    const dateLabel = selectedSchedule
      ? dayjs(selectedSchedule.startTime).format("YYYY-MM-DD")
      : "";
    const timeLabel = selectedSchedule
      ? dayjs(selectedSchedule.startTime).format("HH:mm")
      : "";

    const header = [
      "Customer",
      "Check-in",
      "Pass",
      "Options",
      "Adult",
      "Jeune",
      "Baby",
      "Phone",
      "Email",
      "ResellerId",
    ];

    const rows = guests.map((g) => [
      g.guestName,
      g.status === "CHECKED_IN" ? "YES" : "NO",
      g.passType ?? "",
      g.optionCode ?? "",
      String(g.adults),
      String(g.youth),
      String(g.babies),
      g.phone ?? "",
      g.email ?? "",
      g.resellerId ?? "",
    ]);

    const allLines: string[] = [];
    allLines.push(`Selected date,${dateLabel}`);
    allLines.push(`Selected time,${timeLabel}`);
    allLines.push("");
    allLines.push(header.map((h) => `"**${h}**"`).join(","));
    for (const row of rows) {
      allLines.push(
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
      );
    }

    const csv = allLines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manifest-${dateLabel}-${timeLabel}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-full px-6 py-6 gap-6 text-[#022c22]">
        {/* Sidebar for guide/admin context */}
        <aside className="hidden w-56 flex-shrink-0 flex-col rounded-2xl border border-emerald-500/30 bg-white p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] md:flex">
          <div className="relative flex items-center gap-3 pb-4 border-b border-emerald-500/20">
            <button
              type="button"
              className="flex items-center gap-3"
              onClick={() => {
                const menu = document.getElementById("profile-menu");
                if (!menu) return;
                menu.classList.toggle("hidden");
              }}
            >
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
            </button>

            <div
              id="profile-menu"
              className="absolute right-0 top-10 z-20 hidden w-40 rounded-xl border border-emerald-500/40 bg-white shadow-lg text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/profile";
                }}
                className="block w-full px-3 py-2 text-left hover:bg-emerald-50"
              >
                Profile
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="block w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
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
              className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm bg-emerald-50 text-[#022c22]"
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

        {/* Main content */}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">Manifest</h1>
              <p className="text-sm text-zinc-600">
                Select a tour and time to load guests.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="rounded-xl bg-emerald-700 text-white px-4 py-2 text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_18px_rgba(16,185,129,0.35)]"
              >
                Export CSV
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  onClick={() => {
                    setAddGuideOpen(true);
                    setGuideError(null);
                    setGuideSuccess(null);
                  }}
                  className="rounded-xl bg-emerald-400 text-[#022c22] px-4 py-2 text-sm font-semibold shadow-[0_0_18px_rgba(16,185,129,0.35)] hover:bg-emerald-300 transition-colors"
                >
                  Add Guide
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/40 bg-white p-4">
              <div className="text-sm font-medium">Tour Selector</div>
              <select
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                value={tourId}
                onChange={(e) => {
                  const value = e.target.value;
                  setTourId(value);
                  // clear schedule when tour changes to avoid mismatched selection
                  setScheduleId("");
                }}
                disabled={schedulesLoading}
              >
                <option value="">Select tour</option>
                {tourOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-white p-4">
              <div className="text-sm font-medium">Time Selector</div>
              <select
                className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                value={scheduleId}
                onChange={(e) => setScheduleId(e.target.value)}
                disabled={schedulesLoading}
              >
                <option value="">Select time</option>
                {scheduleOptions.map((s) => (
                  <option key={s.id} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              { label: "Total Guests", value: stats?.totalGuests ?? 0 },
              { label: "Checked In", value: stats?.checkedIn ?? 0 },
              { label: "Not Scanned", value: stats?.notScanned ?? 0 },
              { label: "No Show", value: stats?.noShow ?? 0 },
              { label: "Expected", value: stats?.expected ?? 0 },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-emerald-500/40 bg-white p-4"
              >
                <div className="text-xs text-zinc-600">{card.label}</div>
                <div className="mt-1 text-2xl font-semibold">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-emerald-500/40 bg-white overflow-hidden">
            <div className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                  <span>GUESTS</span>
                  <span>{stats?.totalGuests ?? 0}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700">
                  <span>PASS</span>
                  <span>0</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700">
                  <span>NS</span>
                  <span>{stats?.noShow ?? 0}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-medium text-red-700">
                  <span>SCANNED</span>
                  <span>0</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  <span>INC</span>
                  <span>0</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                  <span>EXP</span>
                  <span>0</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                  <span>BOAT A</span>
                  <span>0</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
                  <span>BOAT C</span>
                  <span>0</span>
                </span>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-4 text-[11px] text-zinc-500">
                <span>
                  First scan:{" "}
                  {stats?.firstScanAt
                    ? dayjs(stats.firstScanAt).format("MMM Do, HH:mm")
                    : "-"}
                </span>
                <span>
                  Last scan:{" "}
                  {stats?.lastScanAt
                    ? dayjs(stats.lastScanAt).format("MMM Do, HH:mm")
                    : "-"}
                </span>
                <label className="ml-4 flex items-center gap-2 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    checked={hideCheckedIn}
                    onChange={(e) => setHideCheckedIn(e.target.checked)}
                    className="h-3 w-3 rounded border-black/[.2] bg-transparent"
                  />
                  <span>Hide checked-in</span>
                </label>
                <div className="text-xs text-zinc-600">
                  {manifestLoading
                    ? "Loading..."
                    : `${visibleGuests.length} bookings`}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-zinc-50 text-zinc-600">
                  <tr>
                    <th className="text-left font-medium px-4 py-2">
                      Customer
                    </th>
                    <th className="text-left font-medium px-4 py-2">Guide</th>
                    <th className="text-left font-medium px-4 py-2">
                      Check-in
                    </th>
                    <th className="text-left font-medium px-4 py-2">Pass</th>
                    <th className="text-left font-medium px-4 py-2">Options</th>
                    <th className="text-left font-medium px-4 py-2">Adult</th>
                    <th className="text-left font-medium px-4 py-2">Jeune</th>
                    <th className="text-left font-medium px-4 py-2">Baby</th>
                    <th className="text-left font-medium px-4 py-2">Phone</th>
                    <th className="text-left font-medium px-4 py-2">Email</th>
                    <th className="text-left font-medium px-4 py-2">
                      ResellerId
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/20">
                  {visibleGuests.map((g) => (
                    <tr key={String(g.bookingId)} className="text-[#022c22]">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="font-medium text-xs">{g.guestName}</div>
                        <div className="text-[10px] text-zinc-500">
                          #{String(g.bookingId)}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSummaryBookingId(String(g.bookingId));
                            setSummaryOpen(true);
                          }}
                          className="rounded-full border border-emerald-500/40 px-3 py-1 text-[11px] text-zinc-600 hover:bg-emerald-50"
                        >
                          {g.checkedIn ? guideDisplayName : "-"}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-medium ${
                            g.status === "CHECKED_IN"
                              ? "bg-emerald-100 text-[#022c22]"
                              : g.status === "NO_SHOW"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {g.status === "CHECKED_IN"
                            ? "YES"
                            : g.status === "NO_SHOW"
                              ? "NO SHOW"
                              : "BOOKED"}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {g.passType ?? "Go Reserve"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {g.optionCode ?? "2FL"}
                      </td>
                      <td className="px-4 py-2 text-center">{g.adults}</td>
                      <td className="px-4 py-2 text-center">{g.youth}</td>
                      <td className="px-4 py-2 text-center">{g.babies}</td>
                      <td className="px-4 py-2 text-xs text-zinc-600 whitespace-nowrap">
                        {g.phone ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-600 whitespace-nowrap">
                        {g.email ?? "—"}
                      </td>
                      <td className="px-4 py-2 text-xs text-zinc-600 whitespace-nowrap">
                        {g.resellerId ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {visibleGuests.length === 0 && !manifestLoading ? (
                    <tr>
                      <td
                        className="px-4 py-10 text-center text-zinc-600"
                        colSpan={10}
                      >
                        {scheduleId
                          ? "No bookings for this tour and time."
                          : "Select a tour and time to view the manifest."}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {summaryOpen && summaryBooking ? (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-[#022c22]">
                    Booking Summary
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(false)}
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-xs text-[#022c22]">
                  <div>
                    <div className="font-medium">Guide</div>
                    <div className="mt-0.5 text-zinc-600">
                      {guideDisplayName}
                    </div>
                  </div>

                  <div>
                    <div className="font-medium">Departure</div>
                    <div className="mt-0.5 text-zinc-600">
                      {selectedSchedule
                        ? dayjs(selectedSchedule.startTime).format("HH:mm")
                        : ""}
                      {summaryBooking.optionCode
                        ? ` with ${summaryBooking.optionCode}`
                        : ""}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-emerald-500/40 px-2 py-0.5 text-[11px]">
                      {summaryBooking.passType ?? "Go Reserve"}
                    </span>
                  </div>

                  <div>
                    <div className="font-medium">
                      {summaryBooking.adults} Adulte, {summaryBooking.youth}{" "}
                      Jeune, {summaryBooking.babies} Baby
                    </div>
                    <div className="mt-0.5 text-zinc-600">
                      <span className="font-semibold">
                        {summaryBooking.adults +
                          summaryBooking.youth +
                          summaryBooking.babies}{" "}
                        Total
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div>
                      <span className="font-medium">Email: </span>
                      <span className="text-zinc-600">
                        {summaryBooking.email ?? "No Value"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Phone: </span>
                      <span className="text-zinc-600">
                        {summaryBooking.phone ?? "No Value"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <div>
                      <span className="font-medium">Reseller Id: </span>
                      <span className="text-zinc-600">
                        {summaryBooking.resellerId ?? "No Value"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Booking Ref: </span>
                      <span className="text-zinc-600">
                        {String(summaryBooking.bookingId)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="font-medium">Payable to guide: </span>
                    <span className="text-zinc-600">
                      €
                      {(
                        (summaryBooking.adults +
                          summaryBooking.youth +
                          summaryBooking.babies) *
                        5
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSummaryOpen(false)}
                    className="rounded-xl border border-emerald-400/60 px-4 py-2 text-xs font-medium text-[#022c22] hover:bg-emerald-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={summarySaving}
                    onClick={async () => {
                      if (!scheduleId || !summaryBooking) return;
                      setSummarySaving(true);
                      try {
                        if (!summaryBooking.primaryParticipantId) {
                          alert("No participant found for this booking.");
                          return;
                        }

                        const res = await fetch("/api/manifest/checkin", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            participantId: summaryBooking.primaryParticipantId,
                            scheduleId,
                          }),
                        });
                        if (res.ok) {
                          setReloadKey((v) => v + 1);
                        } else {
                          const data = await res.json();
                          alert(data.error || "Failed to check in");
                        }
                      } catch {
                        alert("Failed to check in");
                      } finally {
                        setSummarySaving(false);
                      }
                    }}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#022c22] hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {summarySaving ? "Checking in..." : "Check in"}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {isAdmin && addGuideOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div className="w-full max-w-md rounded-2xl border border-emerald-400/50 bg-[#022c22] px-6 py-6 shadow-[0_0_40px_rgba(16,185,129,0.35)]">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-white">
                    Add Guide
                  </h2>
                  <button
                    type="button"
                    onClick={() => setAddGuideOpen(false)}
                    className="text-xs text-emerald-100 hover:text-emerald-300"
                  >
                    Close
                  </button>
                </div>

                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSavingGuide(true);
                    setGuideError(null);
                    setGuideSuccess(null);
                    try {
                      const res = await fetch("/api/admin/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          name: guideName,
                          email: guideEmail,
                          password: guidePassword,
                          role: "guide",
                        }),
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setGuideError(
                          data?.error ??
                            "Failed to create guide. Please try again.",
                        );
                      } else {
                        setGuideSuccess("Guide created successfully.");
                        setGuideName("");
                        setGuideEmail("");
                        setGuidePassword("");
                      }
                    } catch {
                      setGuideError(
                        "Failed to create guide. Please try again.",
                      );
                    } finally {
                      setSavingGuide(false);
                    }
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-emerald-50">
                      Name
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-[#064e3b] px-3 py-2 text-sm text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-300/70"
                      value={guideName}
                      onChange={(e) => setGuideName(e.target.value)}
                      placeholder="Guide name"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-emerald-50">
                      Email
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-[#064e3b] px-3 py-2 text-sm text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-300/70"
                      type="email"
                      value={guideEmail}
                      onChange={(e) => setGuideEmail(e.target.value)}
                      required
                      placeholder="guide@example.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-emerald-50">
                      Password
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-[#064e3b] px-3 py-2 text-sm text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-300/70"
                      type="password"
                      value={guidePassword}
                      onChange={(e) => setGuidePassword(e.target.value)}
                      required
                      placeholder="Set a password"
                    />
                  </div>

                  {guideError ? (
                    <div className="rounded-xl bg-red-900/40 px-3 py-2 text-xs text-red-100">
                      {guideError}
                    </div>
                  ) : null}
                  {guideSuccess ? (
                    <div className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100">
                      {guideSuccess}
                    </div>
                  ) : null}

                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setAddGuideOpen(false)}
                      className="rounded-xl border border-emerald-400/60 px-4 py-2 text-xs font-medium text-emerald-50 hover:bg-emerald-500/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingGuide}
                      className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-semibold text-[#022c22] hover:bg-emerald-300 disabled:opacity-60"
                    >
                      {savingGuide ? "Saving..." : "Create Guide"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
