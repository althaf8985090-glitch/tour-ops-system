import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../../database/connection";
import Tour from "../../../../models/Tour";
import Schedule from "../../../../models/Schedule";
import MeetingPoint from "../../../../models/MeetingPoint";
import Channel from "../../../../models/Channel";
import Customer from "../../../../models/Customer";
import Booking from "../../../../models/Booking";
import Participant from "../../../../models/Participant";
import Ticket from "../../../../models/Ticket";
import Manifest from "../../../../models/Manifest";
import Roster from "../../../../models/Roster";
import Payment from "../../../../models/Payment";
import Checkin from "../../../../models/Checkin";
import Notification from "../../../../models/Notification";
import User from "../../../../models/User";
import { hashPassword } from "../../../../lib/password";

export async function POST(req: Request) {
  const setupSecret = process.env.ADMIN_SETUP_SECRET;
  const provided = req.headers.get("x-setup-secret") ?? "";

  if (!setupSecret || provided !== setupSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();

  // Basic guard: only seed once per database
  const existingTour = await Tour.findOne({
    title: "Eiffel Tower Guided Tour",
  }).lean();
  if (existingTour) {
    return NextResponse.json({ ok: true, alreadySeeded: true });
  }

  // Users
  const adminEmail = "althaf8985090@gmail.com";
  let admin = await User.findOne({ email: adminEmail }).lean();
  if (!admin) {
    const passwordHash = await hashPassword("Althaf1234");
    admin = await User.create({
      name: "Admin",
      email: adminEmail,
      role: "admin",
      passwordHash,
    });
  }

  const guideEmail = "guide@example.com";
  let guide = await User.findOne({ email: guideEmail }).lean();
  if (!guide) {
    const passwordHash = await hashPassword("Guide1234");
    guide = await User.create({
      name: "Sample Guide",
      email: guideEmail,
      role: "guide",
      passwordHash,
    });
  }

  // Channel
  const channel = await Channel.create({
    name: "Direct Web",
    type: "web",
    uuid: new mongoose.Types.ObjectId().toString(),
  });

  // Meeting point
  const meetingPoint = await MeetingPoint.create({
    title: "Eiffel Tower Meeting Point",
    address: "Champ de Mars, 5 Av. Anatole France",
    city: "Paris",
    country: "France",
    latitude: 48.8584,
    longitude: 2.2945,
  });

  // Tour
  const tour = await Tour.create({
    externalProductId: "PARIS_EIFFEL_2FL",
    title: "Eiffel Tower Guided Tour",
    description: "Guided visit of the Eiffel Tower with Seine cruise option.",
    durationHours: 2.5,
    category: "Sightseeing",
    vendor: "UNCLE SAM TOURS",
  });

  // Schedules for today (3 departures)
  const now = new Date();
  const baseDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    9,
    15,
    0,
    0,
  );

  const scheduleTimes = [0, 2, 4].map((hours) => {
    const d = new Date(baseDate);
    d.setHours(baseDate.getHours() + hours);
    return d;
  });

  const schedules = await Promise.all(
    scheduleTimes.map((start) =>
      Schedule.create({
        tourId: tour._id,
        startTime: start,
        endTime: new Date(start.getTime() + 90 * 60 * 1000),
        meetingPoint: meetingPoint._id,
        capacity: 25,
        // Assign our sample guide to each seeded schedule so guides
        // can see them in the manifest.
        guideIds: [(guide as { _id: mongoose.Types.ObjectId })._id],
      }),
    ),
  );

  // Customers
  const customers = await Customer.create([
    {
      externalCustomerId: 1001,
      firstName: "Michael",
      lastName: "Colodonato",
      email: "michael81106@icloud.com",
      phone: "+33123456789",
      nationality: "US",
    },
    {
      externalCustomerId: 1002,
      firstName: "Rima",
      lastName: "Tannous",
      email: "rima@example.com",
      phone: "+33612345678",
      nationality: "FR",
    },
    {
      externalCustomerId: 1003,
      firstName: "Claire",
      lastName: "Dubois",
      email: "claire@example.com",
      phone: "+33698765432",
      nationality: "FR",
    },
  ]);

  // Helper to make a booking with participants
  async function createBooking(params: {
    bookingId: number;
    customerIndex: number;
    scheduleIndex: number;
    status: string;
    guestCounts: { adults: number; youth: number; babies: number };
    checkedInCount: number;
    passType: string;
    optionCode: string;
    resellerId: string;
  }) {
    const schedule = schedules[params.scheduleIndex];
    const customer = customers[params.customerIndex];

    const participantDocs = [];
    const totalGuests =
      params.guestCounts.adults +
      params.guestCounts.youth +
      params.guestCounts.babies;

    for (let i = 0; i < totalGuests; i++) {
      const ticketCategory =
        i < params.guestCounts.adults
          ? "Adult"
          : i < params.guestCounts.adults + params.guestCounts.youth
            ? "Youth"
            : "Baby";
      const participant = await Participant.create({
        booking: undefined, // set after booking is created
        firstName: `${customer.firstName} ${i + 1}`,
        lastName: customer.lastName,
        ticketCategory,
        checkedIn: i < params.checkedInCount,
      });
      participantDocs.push(participant);
    }

    const booking = await Booking.create({
      bookingId: params.bookingId,
      confirmationCode: `CONF-${params.bookingId}`,
      externalReference: `EXT-${params.bookingId}`,
      status: params.status,
      passType: params.passType,
      optionCode: params.optionCode,
      resellerId: params.resellerId,
      currency: "EUR",
      totalPrice: 120,
      totalPaid: 120,
      channel: channel._id,
      customer: customer._id,
      activityBookingId: params.bookingId,
      tour: tour._id,
      startDateTime: schedule.startTime,
      endDateTime: schedule.endTime,
      participants: participantDocs.map((p) => p._id),
    });

    // Backfill booking reference on participants
    await Participant.updateMany(
      { _id: { $in: participantDocs.map((p) => p._id) } },
      { $set: { booking: booking._id } },
    );

    // Tickets
    await Promise.all(
      participantDocs.map((p, idx) =>
        Ticket.create({
          booking: booking._id,
          barcode: `BAR-${params.bookingId}-${idx + 1}`,
          barcodeType: "QR",
          scanned: p.checkedIn,
        }),
      ),
    );

    // Payment
    await Payment.create({
      booking: booking._id,
      amount: 120,
      currency: "EUR",
      paymentType: "card",
      transactionDate: schedule.startTime,
    });

    // Check-in records for checked-in guests
    const checkedInParticipants = participantDocs.filter((p) => p.checkedIn);
    await Promise.all(
      checkedInParticipants.map((p) =>
        Checkin.create({
          participantId: p._id,
          guideId: (guide as { _id: mongoose.Types.ObjectId })._id,
          scheduleId: schedule._id,
          timestamp: new Date(),
          status: "valid",
        }),
      ),
    );

    return { booking, participants: participantDocs };
  }

  const b1 = await createBooking({
    bookingId: 53001,
    customerIndex: 0,
    scheduleIndex: 0,
    status: "confirmed",
    guestCounts: { adults: 2, youth: 1, babies: 0 },
    checkedInCount: 3,
    passType: "Go Reserve",
    optionCode: "2FL",
    resellerId: "7663968",
  });

  const b2 = await createBooking({
    bookingId: 53002,
    customerIndex: 1,
    scheduleIndex: 0,
    status: "confirmed",
    guestCounts: { adults: 3, youth: 0, babies: 0 },
    checkedInCount: 1,
    passType: "Go Reserve",
    optionCode: "2FL",
    resellerId: "5042724",
  });

  const b3 = await createBooking({
    bookingId: 53003,
    customerIndex: 2,
    scheduleIndex: 0,
    status: "no_show",
    guestCounts: { adults: 2, youth: 0, babies: 0 },
    checkedInCount: 0,
    passType: "Go Reserve",
    optionCode: "SUMMIT+C",
    resellerId: "3691809",
  });

  const b4 = await createBooking({
    bookingId: 53004,
    customerIndex: 0,
    scheduleIndex: 1,
    status: "confirmed",
    guestCounts: { adults: 2, youth: 2, babies: 0 },
    checkedInCount: 0,
    passType: "Go Reserve",
    optionCode: "2FL",
    resellerId: "8112233",
  });

  const b5 = await createBooking({
    bookingId: 53005,
    customerIndex: 1,
    scheduleIndex: 1,
    status: "confirmed",
    guestCounts: { adults: 1, youth: 1, babies: 1 },
    checkedInCount: 2,
    passType: "Go Reserve",
    optionCode: "SUNSET",
    resellerId: "9001122",
  });

  const b6 = await createBooking({
    bookingId: 53006,
    customerIndex: 2,
    scheduleIndex: 2,
    status: "confirmed",
    guestCounts: { adults: 4, youth: 0, babies: 0 },
    checkedInCount: 3,
    passType: "Go Reserve",
    optionCode: "EVENING",
    resellerId: "4556677",
  });

  const bookingsForFirstSchedule = [b1.booking, b2.booking, b3.booking];

  // Manifest for first schedule
  const totalGuests =
    3 + 3 + 2; // from above guestCounts (2+1, 3, 2)

  const manifest = await Manifest.create({
    tour: tour._id,
    schedule: schedules[0]._id,
    date: schedules[0].startTime,
    bookings: bookingsForFirstSchedule.map((b) => b._id),
    totalGuests,
  });

  // Roster linking manifest and guide
  await Roster.create({
    manifest: manifest._id,
    guide: (guide as { _id: mongoose.Types.ObjectId })._id,
    assignedAt: new Date(),
  });

  // Notification for guide
  await Notification.create({
    user: (guide as { _id: mongoose.Types.ObjectId })._id,
    type: "assignment",
    message: "You have been assigned to the Eiffel Tower Guided Tour.",
    read: false,
  });

  return NextResponse.json({
    ok: true,
    tourId: String(tour._id),
    scheduleId: String(schedules[0]._id),
    manifestId: String(manifest._id),
  });
}

