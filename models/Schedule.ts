import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema(
  {
    tourId: { type: mongoose.Schema.Types.ObjectId, ref: "Tour" },
    startTime: Date,
    endTime: Date,
    meetingPoint: { type: mongoose.Schema.Types.ObjectId, ref: "MeetingPoint" },
    capacity: Number,
    // Guides assigned to this schedule (can be multiple)
    guideIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

export default mongoose.models.Schedule ||
  mongoose.model("Schedule", ScheduleSchema);
