import mongoose from "mongoose";
import Booking from "../models/Booking";
import Checkin from "../models/Checkin";
import Participant from "../models/Participant";
import Schedule from "../models/Schedule";

export type ManifestStats = {
  totalGuests: number;
  checkedIn: number;
  notScanned: number;
  noShow: number;
  expected: number;
  firstScanAt?: Date | null;
  lastScanAt?: Date | null;
};

export type ManifestGuestRow = {
  bookingId: number | string;
  bookingMongoId: string;
  guestName: string;
  primaryParticipantId?: string;
  checkedIn: boolean;
  checkedInBy?: string;
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

export type ManifestResponse = {
  stats: ManifestStats;
  guests: ManifestGuestRow[];
};

type LeanCustomer = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

type LeanParticipant = {
  _id?: mongoose.Types.ObjectId;
  checkedIn?: boolean;
  status?: "BOOKED" | "CHECKED_IN" | "NO_SHOW";
  firstName?: string;
  lastName?: string;
  ticketCategory?: string;
};

type LeanBooking = {
  _id: mongoose.Types.ObjectId;
  bookingId?: number;
  status?: string;
  passType?: string;
  optionCode?: string;
  resellerId?: string;
  customer?: LeanCustomer | null;
  participants?: LeanParticipant[] | null;
};

function normalizeBookingStatus(
  status: unknown,
): "BOOKED" | "CHECKED_IN" | "NO_SHOW" {
  if (typeof status !== "string") return "BOOKED";
  const normalized = status.trim().toLowerCase();
  if (
    normalized === "no show" ||
    normalized === "noshow" ||
    normalized === "no_show" ||
    normalized === "no-show"
  ) {
    return "NO_SHOW";
  }
  if (
    normalized === "checked in" ||
    normalized === "checked_in" ||
    normalized === "checked-in"
  ) {
    return "CHECKED_IN";
  }
  return "BOOKED";
}

export async function getManifest(params: {
  scheduleId: string;
  guideId?: string;
  isAdmin?: boolean;
}): Promise<ManifestResponse> {
  const { scheduleId, guideId, isAdmin } = params;

  if (!mongoose.isValidObjectId(scheduleId)) {
    throw new Error("Invalid scheduleId");
  }

  const schedule = await Schedule.findById(scheduleId).lean();
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  // No guide-assignment check: every authenticated guide can see all customer
  // data for the selected schedule in the manifest box.

  // Mark no-shows if the tour is already started.
  const now = new Date();
  if (schedule.startTime && now > schedule.startTime) {
    const bookingIds = await Booking.find({ schedule: schedule._id })
      .select({ _id: 1 })
      .lean<{ _id: mongoose.Types.ObjectId }[]>();

    const bookingObjectIds = bookingIds.map((b) => b._id);
    await Participant.updateMany(
      {
        booking: { $in: bookingObjectIds },
        status: "BOOKED",
      },
      { $set: { status: "NO_SHOW" } },
    );
  }

  const bookings = await Booking.find({ schedule: schedule._id })
    .select({
      bookingId: 1,
      status: 1,
      customer: 1,
      participants: 1,
      passType: 1,
      optionCode: 1,
      resellerId: 1,
    })
    .populate({
      path: "customer",
      select: { firstName: 1, lastName: 1, email: 1, phone: 1 },
    })
    .populate({
      path: "participants",
      select: {
        status: 1,
        checkedIn: 1,
        firstName: 1,
        lastName: 1,
        ticketCategory: 1,
      },
    })
    .lean<LeanBooking[]>();

  let totalGuests = 0;
  let checkedIn = 0;
  let notScanned = 0;
  let noShow = 0;

  const allParticipantIds: mongoose.Types.ObjectId[] = [];
  const bookingParticipantsMap = new Map<string, mongoose.Types.ObjectId[]>();

  const guests: ManifestGuestRow[] = [];

  for (const b of bookings) {
    const participants = Array.isArray(b.participants) ? b.participants : [];
    const groupSize = participants.length;

    const participantIds: mongoose.Types.ObjectId[] = [];

    let adults = 0;
    let youth = 0;
    let babies = 0;
    let checkedInCount = 0;
    let noShowCount = 0;

    for (const p of participants) {
      const cat = p.ticketCategory?.toLowerCase();
      if (cat === "youth" || cat === "jeune" || cat === "child") {
        youth += 1;
      } else if (cat === "baby" || cat === "infant") {
        babies += 1;
      } else {
        adults += 1;
      }

      if (p._id) {
        allParticipantIds.push(p._id);
        participantIds.push(p._id);
      }

      const status = p.status ?? (p.checkedIn ? "CHECKED_IN" : "BOOKED");
      if (status === "CHECKED_IN") {
        checkedInCount += 1;
      }
      if (status === "NO_SHOW") {
        noShowCount += 1;
      }
    }

    bookingParticipantsMap.set(String(b._id), participantIds);

    totalGuests += groupSize;
    checkedIn += checkedInCount;
    noShow += noShowCount;
    notScanned += groupSize - checkedInCount - noShowCount;

    const customer = b.customer ?? undefined;
    const guestName = [customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const bookingStatus = normalizeBookingStatus(b.status);

    const status: ManifestGuestRow["status"] =
      bookingStatus === "NO_SHOW"
        ? "NO_SHOW"
        : checkedInCount > 0
          ? "CHECKED_IN"
          : "BOOKED";

    const primaryParticipantId =
      participantIds.length > 0 ? String(participantIds[0]) : undefined;

    guests.push({
      bookingId: b.bookingId ?? String(b._id),
      bookingMongoId: String(b._id),
      guestName: guestName || "Guest",
      primaryParticipantId,
      checkedIn: checkedInCount > 0,
      checkedInBy: undefined,
      passType: b.passType,
      optionCode: b.optionCode,
      adults,
      youth,
      babies,
      phone: customer?.phone,
      email: customer?.email,
      status,
      resellerId: b.resellerId,
    });
  }

  const expected = Math.max(0, totalGuests - checkedIn);

  let firstScanAt: Date | null = null;
  let lastScanAt: Date | null = null;

  const participantGuideMap = new Map<string, string>();
  if (allParticipantIds.length > 0) {
    const checkins = await Checkin.find({
      participantId: { $in: allParticipantIds },
      status: "valid",
    })
      .select({ participantId: 1, guideId: 1, timestamp: 1 })
      .sort({ timestamp: -1 })
      .lean<
        {
          participantId?: mongoose.Types.ObjectId;
          guideId?: mongoose.Types.ObjectId;
          timestamp?: Date;
        }[]
      >();

    for (const c of checkins) {
      const pid = String(c.participantId);
      if (!participantGuideMap.has(pid) && c.guideId) {
        participantGuideMap.set(pid, String(c.guideId));
      }
    }

    const scans = await Checkin.find({
      participantId: { $in: allParticipantIds },
      status: "valid",
    })
      .select({ timestamp: 1 })
      .sort({ timestamp: 1 })
      .lean<{ timestamp?: Date }[]>();

    if (scans.length > 0) {
      firstScanAt = scans[0].timestamp ?? null;
      lastScanAt = scans[scans.length - 1].timestamp ?? null;
    }
  }

  const guestsWithGuide = guests.map((g) => {
    const participantIds = bookingParticipantsMap.get(g.bookingMongoId) ?? [];
    const guideId = participantIds
      .map((id) => participantGuideMap.get(String(id)))
      .find(Boolean);
    return {
      ...g,
      checkedInBy: guideId,
    };
  });

  return {
    stats: {
      totalGuests,
      checkedIn,
      notScanned,
      noShow,
      expected,
      firstScanAt,
      lastScanAt,
    },
    guests: guestsWithGuide,
  };
}
