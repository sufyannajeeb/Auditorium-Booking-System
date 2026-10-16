// ============================================================
// Auditorium Management System - server.js
// Stack: Node.js + Express + MongoDB (Mongoose)
//
// Install:
//   npm init -y
//   npm install express mongoose cors bcryptjs jsonwebtoken multer dotenv
//
// Create a .env file:
//   PORT=5000
//   MONGO_URI=mongodb://127.0.0.1:27017/auditorium_db
//   JWT_SECRET=change_this_secret
//
// Run:  node server.js
// ============================================================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Image upload setup ----------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

// ---------- Database ----------
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/auditorium_db")
  .then(() => {
    console.log("MongoDB connected");
    createDefaultAdmin();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// ============================================================
// MODELS
// ============================================================

// 1. Login model
const loginSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  usertype: { type: String, enum: ["admin", "user"], default: "user" },
});
const Login = mongoose.model("Login", loginSchema);

// 2. User model
const userSchema = new mongoose.Schema({
  loginId: { type: mongoose.Schema.Types.ObjectId, ref: "Login" },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: String,
  address: String,
});
const User = mongoose.model("User", userSchema);

// 3. Auditorium model
const auditoriumSchema = new mongoose.Schema({
  auditoriumName: { type: String, required: true },
  location: String,
  capacity: Number,
  pricePerDay: Number,
  image: String,
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  facilities: [String],
});
const Auditorium = mongoose.model("Auditorium", auditoriumSchema);

// 4. Event model
const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  description: String,
  organizer: String,
  image: String,
  eventDate: String, // YYYY-MM-DD
  price: Number, // ticket price
  seats: Number, // total seats available
  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed", "cancelled"],
    default: "upcoming",
  },
});
const Event = mongoose.model("Event", eventSchema);

// 5. Booking model
const bookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    auditoriumId: { type: mongoose.Schema.Types.ObjectId, ref: "Auditorium", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    bookingDate: { type: String, required: true }, // format: YYYY-MM-DD
    time: String,
    fromTime: String,
    toTime: String,
    noOfPeople: Number,
    status: {
      type: String,
      enum: ["booked", "pending", "confirmed", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);
const Booking = mongoose.model("Booking", bookingSchema);

// 6. Event ticket booking model (separate from auditorium bookings)
const eventBookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    tickets: { type: Number, default: 1, min: 1 },
    ref: { type: String, required: true, unique: true }, // human-readable booking id
    status: {
      type: String,
      enum: ["booked", "confirmed", "cancelled"],
      default: "booked",
    },
  },
  { timestamps: true }
);
const EventBooking = mongoose.model("EventBooking", eventBookingSchema);

// Generates a short unique-looking booking reference, e.g. EVT-8F3K2A
function makeEventRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return "EVT-" + code;
}

// Total tickets already sold (non-cancelled) for an event
async function soldTickets(eventId) {
  const bookings = await EventBooking.find({ eventId, status: { $ne: "cancelled" } });
  return bookings.reduce((sum, b) => sum + (Number(b.tickets) || 0), 0);
}

// ============================================================
// MIDDLEWARE
// ============================================================
const JWT_SECRET = process.env.JWT_SECRET || "secret";

const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token provided" });
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET); // { loginId, userId, usertype }
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user.usertype !== "admin")
    return res.status(403).json({ message: "Admin access only" });
  next();
};

// Creates a default admin (username: admin, password: admin123) on first run
async function createDefaultAdmin() {
  const exists = await Login.findOne({ usertype: "admin" });
  if (!exists) {
    const hashed = await bcrypt.hash("admin123", 10);
    await Login.create({ username: "admin", password: hashed, usertype: "admin" });
    console.log("Default admin created -> admin / admin123");
  }
}

// ============================================================
// AUTH ROUTES  (User Module: Register / Login)
// ============================================================

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, name, email, phoneNumber, address } = req.body;
    if (!username || !password || !name || !email)
      return res.status(400).json({ message: "Required fields missing" });

    if (await Login.findOne({ username }))
      return res.status(400).json({ message: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const login = await Login.create({ username, password: hashed, usertype: "user" });
    await User.create({ loginId: login._id, name, email, phoneNumber, address });

    res.status(201).json({ message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const login = await Login.findOne({ username });
    if (!login) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, login.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const user = await User.findOne({ loginId: login._id });
    const token = jwt.sign(
      { loginId: login._id, userId: user ? user._id : null, usertype: login.usertype },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, usertype: login.usertype, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================================================
// AUDITORIUM ROUTES
// ============================================================

// View all auditoriums (any logged in user)
app.get("/api/auditoriums", auth, async (req, res) => {
  const filter = req.user.usertype === "admin" ? {} : { status: "active" };
  res.json(await Auditorium.find(filter));
});

// View one auditorium
app.get("/api/auditoriums/:id", auth, async (req, res) => {
  const aud = await Auditorium.findById(req.params.id);
  if (!aud) return res.status(404).json({ message: "Not found" });
  res.json(aud);
});

// View availability for a date  ->  /api/auditoriums/:id/availability?date=2026-10-20
// Availability for one date or a whole month.
// GET /api/auditoriums/:id/availability?date=YYYY-MM-DD
// GET /api/auditoriums/:id/availability?month=YYYY-MM
app.get("/api/auditoriums/:id/availability", auth, async (req, res) => {
  const { date, month } = req.query;

  const parseTime = (t) => {
    if (!t || typeof t !== "string") return null;
    const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 24 || min < 0 || min > 59) return null;
    if (h === 24 && min !== 0) return null;
    return h * 60 + min;
  };

  const intervalsOf = (b) => {
    let s = parseTime(b.fromTime);
    let e = parseTime(b.toTime);
    if (s === null || e === null) {
      if (b.time && String(b.time).includes("-")) {
        const parts = String(b.time).split("-").map((x) => x.trim());
        s = parseTime(parts[0]);
        e = parseTime(parts[1]);
      }
    }
    if (s === null || e === null || e <= s) {
      return [{ start: 0, end: 24 * 60 }];
    }
    return [{ start: s, end: e }];
  };

  const statusFor = (bookings) => {
    const slots = bookings.map((b) => ({
      fromTime: b.fromTime || null,
      toTime: b.toTime || null,
      time: b.time || null,
      status: b.status,
    }));
    if (!bookings.length) {
      return { status: "available", slots };
    }
    let merged = [];
    const ivs = bookings.flatMap(intervalsOf).sort((a, b) => a.start - b.start);
    for (const iv of ivs) {
      if (!merged.length || iv.start > merged[merged.length - 1].end) {
        merged.push({ start: iv.start, end: iv.end });
      } else {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, iv.end);
      }
    }
    let cursor = 0;
    let maxGap = 0;
    for (const iv of merged) {
      if (iv.start > cursor) maxGap = Math.max(maxGap, iv.start - cursor);
      cursor = Math.max(cursor, iv.end);
    }
    if (cursor < 24 * 60) maxGap = Math.max(maxGap, 24 * 60 - cursor);

    // A date is fully booked (red) only when no 30-minute gap exists.
    if (maxGap < 30) {
      return { status: "booked", slots };
    }
    return { status: "partial", slots };
  };

  if (month) {
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "month must be YYYY-MM" });
    }
    const entries = month.split("-").map(Number);
    const y = entries[0];
    const m = entries[1];
    const daysInMonth = new Date(y, m, 0).getDate();
    const start = month + "-01";
    const end = month + "-" + String(daysInMonth).padStart(2, "0");

    const bookings = await Booking.find({
      auditoriumId: req.params.id,
      bookingDate: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    });

    const byDate = {};
    bookings.forEach((b) => {
      if (!byDate[b.bookingDate]) byDate[b.bookingDate] = [];
      byDate[b.bookingDate].push(b);
    });

    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = month + "-" + String(d).padStart(2, "0");
      const info = statusFor(byDate[ds] || []);
      days.push({ date: ds, status: info.status, slots: info.slots });
    }
    return res.json({ month, days });
  }

  if (!date) return res.status(400).json({ message: "date or month is required" });

  const bookings = await Booking.find({
    auditoriumId: req.params.id,
    bookingDate: date,
    status: { $ne: "cancelled" },
  });
  const info = statusFor(bookings);
  res.json({ date, status: info.status, available: info.status !== "booked", slots: info.slots });
});

// Admin: Add auditorium
app.post("/api/auditoriums", auth, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const { auditoriumName, location, capacity, pricePerDay, status, facilities } = req.body;
    const aud = await Auditorium.create({
      auditoriumName,
      location,
      capacity,
      pricePerDay,
      status,
      facilities: facilities ? facilities.split(",").map((f) => f.trim()) : [],
      image: req.file ? "/uploads/" + req.file.filename : "",
    });
    res.status(201).json(aud);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Edit auditorium
app.put("/api/auditoriums/:id", auth, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.facilities)
      update.facilities = update.facilities.split(",").map((f) => f.trim());
    if (req.file) update.image = "/uploads/" + req.file.filename;

    const aud = await Auditorium.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!aud) return res.status(404).json({ message: "Not found" });
    res.json(aud);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Delete auditorium
app.delete("/api/auditoriums/:id", auth, adminOnly, async (req, res) => {
  await Auditorium.findByIdAndDelete(req.params.id);
  res.json({ message: "Auditorium deleted" });
});

// ============================================================
// EVENT ROUTES (Admin: Manage events)
// ============================================================

app.get("/api/events", auth, async (req, res) => {
  const events = await Event.find();
  const result = await Promise.all(
    events.map(async (e) => {
      const seats = Number(e.seats) || 0;
      const sold = await soldTickets(e._id);
      return {
        ...e.toObject(),
        sold,
        available: seats > 0 ? Math.max(seats - sold, 0) : null,
      };
    })
  );
  res.json(result);
});

app.post("/api/events", auth, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const event = await Event.create({
      ...req.body,
      image: req.file ? "/uploads/" + req.file.filename : "",
    });
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put("/api/events/:id", auth, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const update = { ...req.body };
    if (req.file) update.image = "/uploads/" + req.file.filename;
    const event = await Event.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!event) return res.status(404).json({ message: "Not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/events/:id", auth, adminOnly, async (req, res) => {
  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: "Event deleted" });
});

// ============================================================
// USER MANAGEMENT (Admin: Manage users)
// ============================================================

app.get("/api/users", auth, adminOnly, async (req, res) => {
  res.json(await User.find().populate("loginId", "username usertype"));
});

// Get a single user's profile (the account owner or an admin)
app.get("/api/users/:id", auth, async (req, res) => {
  try {
    const isSelf = String(req.user.userId) === String(req.params.id);
    if (!isSelf && req.user.usertype !== "admin")
      return res.status(403).json({ message: "Not allowed" });

    const user = await User.findById(req.params.id).populate("loginId", "username usertype");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      username: user.loginId ? user.loginId.username : "",
      usertype: user.loginId ? user.loginId.usertype : "user",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/users/:id", auth, adminOnly, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "Not found" });
  await Login.findByIdAndDelete(user.loginId);
  await User.findByIdAndDelete(user._id);
  res.json({ message: "User deleted" });
});

// ============================================================
// BOOKING ROUTES
// ============================================================

// User: Book auditorium
app.post("/api/bookings", auth, async (req, res) => {
  try {
    const {
      auditoriumId,
      eventId,
      bookingDate,
      time,
      fromTime: bodyFrom,
      toTime: bodyTo,
      from,
      to,
      startTime,
      endTime,
      noOfPeople,
      status,
    } = req.body;

    const fromTime = bodyFrom || from || startTime;
    const toTime = bodyTo || to || endTime;

    const parseTime = (t) => {
      if (!t || typeof t !== "string") return null;
      const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return null;
      const h = Number(m[1]);
      const min = Number(m[2]);
      if (h < 0 || h > 24 || min < 0 || min > 59) return null;
      if (h === 24 && min !== 0) return null;
      return h * 60 + min;
    };

    const newStart = parseTime(fromTime);
    const newEnd = parseTime(toTime);
    if (newStart === null || newEnd === null || newEnd <= newStart) {
      return res.status(400).json({ message: "Valid from/to time is required" });
    }

    const aud = await Auditorium.findById(auditoriumId);
    if (!aud || aud.status !== "active")
      return res.status(400).json({ message: "Auditorium not available" });

    const people = Number(noOfPeople);
    if (!Number.isFinite(people) || people < 1)
      return res.status(400).json({ message: "Enter a valid number of people" });
    if (aud.capacity && people > Number(aud.capacity))
      return res.status(400).json({
        message: `This auditorium can hold at most ${aud.capacity} people`,
      });

    const expand = (b) => {
      let s = parseTime(b.fromTime);
      let e = parseTime(b.toTime);
      if (s === null || e === null) {
        if (b.time && String(b.time).includes("-")) {
          const parts = String(b.time).split("-").map((x) => x.trim());
          s = parseTime(parts[0]);
          e = parseTime(parts[1]);
        }
      }
      if (s === null || e === null || e <= s) {
        return { start: 0, end: 24 * 60 };
      }
      return { start: s, end: e };
    };

    const existing = await Booking.find({
      auditoriumId,
      bookingDate,
      status: { $ne: "cancelled" },
    });

    const clash = existing.some((b) => {
      const iv = expand(b);
      return iv.start < newEnd && newStart < iv.end;
    });

    if (clash)
      return res.status(400).json({ message: "Auditorium already booked for the selected time" });

    const booking = await Booking.create({
      userId: req.user.userId,
      auditoriumId,
      eventId,
      bookingDate,
      time: time || `${fromTime} - ${toTime}`,
      fromTime,
      toTime,
      noOfPeople,
      status: status || "booked",
    });
    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User: View my bookings
app.get("/api/bookings/my", auth, async (req, res) => {
  const bookings = await Booking.find({ userId: req.user.userId })
    .populate("auditoriumId", "auditoriumName location pricePerDay")
    .populate("eventId", "eventName");
  res.json(bookings);
});

// User: Cancel booking
app.put("/api/bookings/:id/cancel", auth, async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: "Booking not found" });

  const isOwner = String(booking.userId) === String(req.user.userId);
  if (!isOwner && req.user.usertype !== "admin")
    return res.status(403).json({ message: "Not allowed" });

  if (String(booking.status || "").toLowerCase() === "cancelled")
    return res.status(400).json({ message: "Booking already cancelled" });

  // User (non-admin) cancellations are only allowed at least 2 days
  // before the booking date.
  if (req.user.usertype !== "admin") {
    const bookingDate = new Date(String(booking.bookingDate).slice(0, 10) + "T00:00:00");
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() + 2);
    if (isNaN(bookingDate.getTime()) || bookingDate < cutoff) {
      return res.status(400).json({ message: "Cancellation is only allowed at least 2 days before the booking date" });
    }
  }

  booking.status = "cancelled";
  await booking.save();
  res.json({ message: "Booking cancelled", booking });
});

// Admin: View all booking details
app.get("/api/bookings", auth, adminOnly, async (req, res) => {
  const bookings = await Booking.find()
    .populate("userId", "name email phoneNumber")
    .populate("auditoriumId", "auditoriumName location")
    .populate("eventId", "eventName");
  res.json(bookings);
});

// ============================================================
// EVENT TICKET BOOKING ROUTES (separate from auditorium bookings)
// ============================================================

// User: book tickets for an event
app.post("/api/event-bookings", auth, async (req, res) => {
  try {
    const { eventId } = req.body;

    // tickets defaults to 1, but an explicitly invalid/zero value is rejected.
    let tickets = 1;
    if (req.body.tickets !== undefined && req.body.tickets !== null && req.body.tickets !== "") {
      const n = Number(req.body.tickets);
      tickets = Number.isFinite(n) ? Math.floor(n) : NaN;
      if (!Number.isFinite(tickets) || tickets < 1)
        return res.status(400).json({ message: "Enter a valid number of tickets" });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (["completed", "cancelled"].includes(String(event.status || "").toLowerCase()))
      return res.status(400).json({ message: "This event is not open for booking" });

    const seats = Number(event.seats) || 0;
    const sold = await soldTickets(event._id);
    const available = seats > 0 ? seats - sold : Infinity;

    if (seats > 0 && tickets > available)
      return res
        .status(400)
        .json({ message: `Only ${Math.max(available, 0)} ticket(s) left for this event` });

    // Unique booking reference
    let ref = makeEventRef();
    for (let i = 0; i < 5 && (await EventBooking.findOne({ ref })); i++) ref = makeEventRef();

    const booking = await EventBooking.create({
      userId: req.user.userId,
      eventId,
      tickets,
      ref,
      status: "booked",
    });

    const populated = await EventBooking.findById(booking._id).populate(
      "eventId",
      "eventName eventDate price image organizer status"
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User: view my event tickets
app.get("/api/event-bookings/my", auth, async (req, res) => {
  const bookings = await EventBooking.find({ userId: req.user.userId })
    .populate("eventId", "eventName eventDate price image organizer status")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// User/Admin: cancel an event ticket booking
app.put("/api/event-bookings/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await EventBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Event booking not found" });

    const isOwner = String(booking.userId) === String(req.user.userId);
    if (!isOwner && req.user.usertype !== "admin")
      return res.status(403).json({ message: "Not allowed" });

    if (String(booking.status).toLowerCase() === "cancelled")
      return res.status(400).json({ message: "Booking already cancelled" });

    booking.status = "cancelled";
    await booking.save();
    res.json({ message: "Event booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: view all event tickets
app.get("/api/event-bookings", auth, adminOnly, async (req, res) => {
  const bookings = await EventBooking.find()
    .populate("userId", "name email phoneNumber")
    .populate("eventId", "eventName eventDate price");
  res.json(bookings);
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));