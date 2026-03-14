import mongoose from "mongoose";
import Booking from "../models/Booking";
import Checkin from "../models/Checkin";
import Participant from "../models/Participant";
import Schedule from "../models/Schedule";

export type CheckinResult = {
  participantId: string;
  bookingId: string;
  scheduleId: string;
  guideId: string;
  timestamp: string;
};

export async function checkInParticipant(params: {
  participantId: string;
  scheduleId: string;
  guideId: string;
}): Promise<CheckinResult> {
  const { participantId, scheduleId, guideId } = params;

  if (!mongoose.isValidObjectId(participantId)) {
    throw new Error("Invalid participantId");
  }
  if (!mongoose.isValidObjectId(scheduleId)) {
    throw new Error("Invalid scheduleId");
  }
  if (!mongoose.isValidObjectId(guideId)) {
    throw new Error("Invalid guideId");
  }

  const schedule = await Schedule.findById(scheduleId).lean();
  if (!schedule) {
    throw new Error("Schedule not found");
  }

  const participant = await Participant.findById(participantId);
  if (!participant) {
    throw new Error("Participant not found");
  }

  if (participant.status === "CHECKED_IN") {
    throw new Error("Participant already checked in");
  }

  // Verify that the participant belongs to a booking for this schedule.
  const booking = await Booking.findById(participant.booking);
  if (!booking) {
    throw new Error("Booking not found");
  }
  if (!booking.schedule || String(booking.schedule) !== String(schedule._id)) {
    throw new Error("Participant does not belong to this schedule");
  }

  // Mark participant as checked in.
  participant.checkedIn = true;
  participant.status = "CHECKED_IN";
  await participant.save();

  const now = new Date();
  const checkin = await Checkin.create({
    participantId: participant._id,
    guideId: new mongoose.Types.ObjectId(guideId),
    scheduleId: schedule._id,
    timestamp: now,
    status: "valid",
  });

  return {
    participantId: String(participant._id),
    bookingId: String(booking._id),
    scheduleId: String(schedule._id),
    guideId,
    timestamp: now.toISOString(),
  };
}
