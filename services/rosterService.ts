import Roster from "../models/Roster";
import Schedule from "../models/Schedule";
import Checkin from "../models/Checkin";

export async function createRoster({
  scheduleId,
  guideId,
}: {
  scheduleId: string;
  guideId: string;
}) {
  // Validate schedule exists and guide is assigned
  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  if (
    !schedule.guideIds.some((id: { toString(): string }) => id.toString() === guideId)
  ) {
    throw new Error("Guide not assigned to this schedule");
  }

  // Check if roster already exists for this schedule
  const existingRoster = await Roster.findOne({ scheduleId });
  if (existingRoster) {
    throw new Error("Roster already exists for this schedule");
  }

  // Get all checked-in participants for this schedule
  const checkins = await Checkin.find({ scheduleId }).populate("participantId");
  const participantIds = checkins.map((checkin) => checkin.participantId);

  // Create roster
  const roster = new Roster({
    tourId: schedule.tourId,
    scheduleId,
    guideIds: schedule.guideIds,
    participantIds,
    status: "ACTIVE",
    paymentStatus: "PENDING",
  });

  await roster.save();
  return roster;
}

export async function completeRoster({
  rosterId,
  guideId,
}: {
  rosterId: string;
  guideId: string;
}) {
  const roster = await Roster.findById(rosterId);
  if (!roster) {
    throw new Error("Roster not found");
  }

  if (
    !roster.guideIds.some((id: { toString(): string }) => id.toString() === guideId)
  ) {
    throw new Error("Guide not assigned to this roster");
  }

  if (roster.status !== "ACTIVE") {
    throw new Error("Roster is not active");
  }

  roster.status = "COMPLETED";
  await roster.save();
  return roster;
}

export async function requestRosterPayment({
  rosterId,
  guideId,
}: {
  rosterId: string;
  guideId: string;
}) {
  const roster = await Roster.findById(rosterId);
  if (!roster) {
    throw new Error("Roster not found");
  }

  if (
    !roster.guideIds.some((id: { toString(): string }) => id.toString() === guideId)
  ) {
    throw new Error("Guide not assigned to this roster");
  }

  if (roster.status !== "COMPLETED") {
    throw new Error("Roster must be completed before requesting payment");
  }

  if (roster.paymentStatus !== "PENDING") {
    throw new Error("Payment already requested or processed");
  }

  roster.paymentStatus = "REQUESTED";
  await roster.save();
  return roster;
}
