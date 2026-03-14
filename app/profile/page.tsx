"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type ProfileData = {
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  role: string;
};

// Profile page for updating guide account details and changing password.
// This page loads the current user profile from `/api/profile` and allows
// the logged-in user to update their name/email/phone and change password.
export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileData | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/profile")
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? "Failed to load profile");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const user = data?.user as ProfileData | undefined;
        if (user) {
          setForm(user);
        }
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load profile");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const avatarInitial =
    (session?.user?.name || session?.user?.email || "G").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-emerald-50">
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl px-6 py-6 gap-6 text-[#022c22]">
        <aside className="hidden w-56 flex-shrink-0 flex-col rounded-2xl border border-emerald-500/30 bg-white p-4 shadow-[0_0_30px_rgba(16,185,129,0.15)] md:flex">
          <div className="flex items-center gap-3 pb-4 border-b border-emerald-500/20">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-semibold text-white">
              {avatarInitial}
            </div>
            <div>
              <div className="text-sm font-semibold">
                {session?.user?.name || "Guide"}
              </div>
              <div className="text-xs text-zinc-500">
                {session?.user?.role === "admin" ? "Admin" : "Guide"}
              </div>
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
          <h1 className="text-xl font-semibold">Profile</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Personal information associated with your guide account.
          </p>

          {loading ? (
            <div className="mt-6 text-sm text-zinc-600">Loading profile…</div>
          ) : error ? (
            <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : form ? (
            <>
              <form
                className="mt-6 space-y-4 max-w-xl"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSaving(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const res = await fetch("/api/profile", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        firstName: form.firstName,
                        lastName: form.lastName,
                        email: form.email,
                        phone: form.phone,
                      }),
                    });
                    if (!res.ok) {
                      const body = (await res.json().catch(() => null)) as
                        | { error?: string }
                        | null;
                      throw new Error(body?.error ?? "Failed to save profile");
                    }
                    setSuccess("Profile updated successfully.");
                  } catch (e: unknown) {
                    setError(
                      e instanceof Error ? e.message : "Failed to save profile",
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      First name
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                      value={form.firstName ?? ""}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, firstName: e.target.value } : prev,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Last name
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                      value={form.lastName ?? ""}
                      onChange={(e) =>
                        setForm((prev) =>
                          prev ? { ...prev, lastName: e.target.value } : prev,
                        )
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">
                    E-mail
                  </label>
                  <input
                    className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, email: e.target.value } : prev,
                      )
                    }
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700">Phone</label>
                  <input
                    className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                    value={form.phone ?? ""}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev ? { ...prev, phone: e.target.value } : prev,
                      )
                    }
                  />
                </div>

                {error ? (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                {success ? (
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {success}
                  </div>
                ) : null}

                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#022c22] hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>

              <div className="mt-10 max-w-xl border-t border-zinc-200 pt-6">
                <h2 className="text-sm font-semibold text-zinc-800">
                  Security
                </h2>
                <p className="mt-1 text-xs text-zinc-600">
                  Change the password you use to sign in.
                </p>

                <form
                  className="mt-4 space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    if (!newPassword || newPassword.length < 6) {
                      setPasswordError("Password must be at least 6 characters.");
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      setPasswordError("Passwords do not match.");
                      return;
                    }
                    setPasswordSaving(true);
                    try {
                      const res = await fetch("/api/profile/password", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ newPassword }),
                      });
                      if (!res.ok) {
                        const body = (await res.json().catch(() => null)) as
                          | { error?: string }
                          | null;
                        throw new Error(body?.error ?? "Failed to update password");
                      }
                      setPasswordSuccess("Password updated successfully.");
                      setNewPassword("");
                      setConfirmPassword("");
                    } catch (e: unknown) {
                      setPasswordError(
                        e instanceof Error ? e.message : "Failed to update password",
                      );
                    } finally {
                      setPasswordSaving(false);
                    }
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      New password
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700">
                      Confirm password
                    </label>
                    <input
                      className="w-full rounded-xl border border-emerald-500/40 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300/70"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  {passwordError ? (
                    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                      {passwordError}
                    </div>
                  ) : null}
                  {passwordSuccess ? (
                    <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      {passwordSuccess}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="mt-1 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-[#022c22] hover:bg-emerald-300 disabled:opacity-60"
                  >
                    {passwordSaving ? "Updating..." : "Change password"}
                  </button>
                </form>
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

