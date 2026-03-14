"use client";

import { useEffect, useMemo, useState } from "react";

// Core data shapes used by the manifest UI.
// These are returned from the backend APIs under /api/tours, /api/schedules, /api/manifest.
export type TourOption = { _id: string; title: string };
export type ScheduleOption = {
  _id: string;
  tourId: string;
  tourTitle?: string;
  startTime: string;
  endTime?: string;
  capacity?: number;
  guideIds?: string[];
};

// Manifest summary statistics that are shown in the cards at the top of the manifest.
export type ManifestStats = {
  totalGuests: number;
  checkedIn: number;
  notScanned: number;
  noShow: number;
  expected: number;
  firstScanAt?: string | null;
  lastScanAt?: string | null;
};

// One row in the manifest booking list.
export type ManifestGuest = {
  bookingId: number | string;
  bookingMongoId: string;
  guestName: string;
  primaryParticipantId?: string;
  checkedIn: boolean;
  checkedInBy?: string; // guide id who checked in the booking
  passType?: string;
  optionCode?: string;
  adults: number;
  youth: number;
  babies: number;
  phone?: string;
  email?: string;
  status: "BOOKED" | "CHECKED_IN" | "NO_SHOW";
  resellerId?: string;
};

// Fetches the list of tours available to a user.
// This hook is intended to be used by the manifest UI to populate the tour selector.
export function useTours() {
  const [tours, setTours] = useState<TourOption[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tours")
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setTours(data?.tours ?? []);
        setLoaded(true);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load tours");
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { tours, loading: !loaded, error };
}

// Fetches available schedules for a given tour.
// Re-runs whenever `tourId` changes.
export function useSchedules(tourId?: string) {
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [loadedTourId, setLoadedTourId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!tourId) return;
    fetch(`/api/schedules?tourId=${encodeURIComponent(tourId)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSchedules(data?.schedules ?? []);
        setLoadedTourId(tourId);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load schedules");
        setLoadedTourId(tourId);
      });

    return () => {
      cancelled = true;
    };
  }, [tourId]);

  const loading = Boolean(tourId && loadedTourId !== tourId);
  return {
    schedules: tourId ? schedules : [],
    loading,
    error: tourId ? error : null,
  };
}

export function useGuideSchedules(guideId?: string) {
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [loadedGuideId, setLoadedGuideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!guideId) return;

    fetch(`/api/schedules?guideId=${encodeURIComponent(guideId)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed to load schedules");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSchedules(data?.schedules ?? []);
        setLoadedGuideId(guideId);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load schedules");
        setLoadedGuideId(guideId);
      });

    return () => {
      cancelled = true;
    };
  }, [guideId]);

  const loading = Boolean(guideId && loadedGuideId !== guideId);
  return {
    schedules: guideId ? schedules : [],
    loading,
    error: guideId ? error : null,
  };
}

// Fetches rosters for a guide
export function useGuideRosters(guideId?: string) {
  const [rosters, setRosters] = useState<any[]>([]);
  const [loadedGuideId, setLoadedGuideId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!guideId) return;

    fetch(`/api/rosters?guideId=${encodeURIComponent(guideId)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed to load rosters");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setRosters(data?.rosters ?? []);
        setLoadedGuideId(guideId);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load rosters");
        setLoadedGuideId(guideId);
      });

    return () => {
      cancelled = true;
    };
  }, [guideId]);

  const loading = Boolean(guideId && loadedGuideId !== guideId);
  return {
    rosters: guideId ? rosters : [],
    loading,
    error: guideId ? error : null,
  };
}

// Fetches the manifest for a given schedule.
// The `reloadKey` can be changed to force a refresh even if `scheduleId` hasn't changed.
export function useManifest(scheduleId?: string, reloadKey?: string | number) {
  const [stats, setStats] = useState<ManifestStats | null>(null);
  const [guests, setGuests] = useState<ManifestGuest[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = useMemo(() => {
    if (!scheduleId) return null;
    const base = `${scheduleId}`;
    return reloadKey !== undefined ? `${base}|${reloadKey}` : base;
  }, [scheduleId, reloadKey]);

  useEffect(() => {
    let cancelled = false;
    if (!key || !scheduleId) return;
    fetch(`/api/manifest?scheduleId=${encodeURIComponent(scheduleId)}`)
      .then(async (r) => {
        if (!r.ok) {
          const body = (await r.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(body?.error ?? "Failed to load manifest");
        }
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const s = data?.stats as
          | (ManifestStats & {
              firstScanAt?: string | null;
              lastScanAt?: string | null;
            })
          | null
          | undefined;
        setStats(
          s
            ? {
                ...s,
                firstScanAt: s.firstScanAt ?? null,
                lastScanAt: s.lastScanAt ?? null,
              }
            : null,
        );
        setGuests(data?.guests ?? []);
        setLoadedKey(key);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load manifest");
        setLoadedKey(key);
      });

    return () => {
      cancelled = true;
    };
  }, [key, scheduleId]);

  const loading = Boolean(key && loadedKey !== key);
  return {
    stats: key ? stats : null,
    guests: key ? guests : [],
    loading,
    error: key ? error : null,
  };
}
