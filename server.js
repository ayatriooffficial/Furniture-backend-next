require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const compression = require("compression");
const PORT = process.env.PORT || 4000;
const socket = require("socket.io");
const bodyParser = require("body-parser");

// database connection
require("./database/connection")();
app.use(
  compression({
    level: 6,
    threshold: 1024, // Only compress responses larger than 1KB
  }),
);

// CORS policy
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://3.110.90.35:3000",
      "https://ayatrio.com",
      "https://frontend.ayatrio.com",
      "http://3.109.78.94:3000",
      "https://www.ayatrio.com",
      "http://ayatrio-admin.s3-website.ap-south-1.amazonaws.com",
      "https://main.d2e7lk624os6uh.amplifyapp.com",
      "http://13.203.148.236:3000", // ← your current frontend IP
    ],
    methods: "GET,POST,PUT,DELETE,PATCH",
    credentials: true,
  }),
);

app.use(express.json({ limit: "50mb" }));
app.use(express.text({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser()); // app.use(bodyParser.json({ limit: "50mb" }));

// ✅ Trust proxy to pass trusted client IP
app.set("trust proxy", 1);

// ✅ Session middleware with proper cookie configuration
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Welcome to Ayatrio API");
});

// // setuppassport
app.use(passport.initialize());
app.use(passport.session());

// // passport strategy for Google login
require("./config/passport")(passport);

// passport auth routes
app.use("/auth", require("./routes/googleAuth"));

app.use("/api", (req, res, next) => {
  // Cache GET requests for 1 hour, CDN for 24 hours
  if (req.method === "GET") {
    res.setHeader(
      "Cache-Control",
      "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    );
  }
  next();
});

// other routes
app.use("/api", require("./routes/routes"));

// home page routes
app.use("/api", require("./routes/homepageRoutes"));

// admin routes
app.use("/admin", require("./routes/admin"));

// admin routes
app.use("/indexing", require("./routes/indexing"));

// payment routes
app.use("/payment", require("./routes/paymentRoutes"));

// socket connection
const server = app.listen(PORT, () => {
  console.log(`server started on http://localhost:${PORT}`);
});

const io = socket(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://ayatrio.com",
      "http://localhost:5173",
      "https://frontend.ayatrio.com",
      "http://3.109.78.94:3000",
      "http://3.110.90.35:3000",
      "https://www.ayatrio.com",
      "https://frontendtrail.ayatrio.com",
      "http://localhost:5173",
      "http://13.203.148.236:3000",
    ],
  },
});

const roomToUsers = new Map();
const userToRoom = new Map(); // Track user's current room
const roomMetadata = new Map(); // Store room information
const userInfo = new Map();

io.on("connection", (socket) => {
  socket.on("join-room", ({ roomId, userInfo: userData }) => {
    // Store user name
    if (userData && userData.displayName) {
      userInfo.set(socket.id, userData.displayName);
    }

    const previousRoom = userToRoom.get(socket.id);
    if (previousRoom) {
      socket.leave(previousRoom);
      roomToUsers.get(previousRoom)?.delete(socket.id);
    }

    if (!roomToUsers.has(roomId)) {
      roomToUsers.set(roomId, new Set());
      roomMetadata.set(roomId, {
        createdAt: Date.now(),
        maxUsers: 10,
      });
    }

    const room = roomToUsers.get(roomId);

    if (room.size >= roomMetadata.get(roomId).maxUsers) {
      socket.emit("room-full");
      return;
    }

    room.add(socket.id);
    userToRoom.set(socket.id, roomId);
    socket.join(roomId);

    // Send user names along with user joined event
    const usersWithNames = {};
    Array.from(room).forEach((userId) => {
      usersWithNames[userId] =
        userInfo.get(userId) || `User ${userId.slice(-4)}`;
    });

    io.to(roomId).emit("user-joined", {
      userId: socket.id,
      users: Array.from(room),
      userCount: room.size,
      userNames: usersWithNames,
    });
  });

  socket.on("leave-room", ({ roomId }) => {
    if (roomToUsers.has(roomId)) {
      roomToUsers.get(roomId).delete(socket.id);
      io.to(roomId).emit("user-left", { userId: socket.id });
    }
    socket.leave(roomId);
  });

  socket.on("disconnect", () => {
    const roomId = userToRoom.get(socket.id);
    if (roomId && roomToUsers.has(roomId)) {
      roomToUsers.get(roomId).delete(socket.id);
      userToRoom.delete(socket.id);
      userInfo.delete(socket.id); // Clean up user name
      socket.to(roomId).emit("user-left", {
        userId: socket.id,
        userCount: roomToUsers.get(roomId).size,
      });
    }
  });

  // Rate limiting
  const signalRateLimit = new Map();

  const checkRateLimit = (eventType) => {
    const key = `${socket.id}-${eventType}`;
    const now = Date.now();
    const limit = signalRateLimit.get(key) || {
      count: 0,
      resetTime: now + 1000,
    };

    if (now > limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + 1000;
    }

    limit.count++;
    signalRateLimit.set(key, limit);

    return limit.count <= 50;
  };

  socket.on("offer", ({ to, offer }) => {
    if (checkRateLimit("offer")) {
      io.to(to).emit("offer", { from: socket.id, offer });
    }
  });

  socket.on("answer", ({ to, answer }) => {
    if (checkRateLimit("answer")) {
      io.to(to).emit("answer", { from: socket.id, answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    if (checkRateLimit("ice-candidate")) {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    }
  });

  socket.on("request_join", (data) => {
    io.emit("join_request", { socketId: socket.id, ...data });
  });

  socket.on("admin_response", (response) => {
    const { socketId, accepted, roomId } = response;
    if (accepted) {
      io.to(socketId).emit("join_accepted", { roomId });
      socket.join(roomId);
      io.to(roomId).emit("join_accepted_admin", { roomId });
    } else {
      io.to(socketId).emit("join_rejected");
    }
  });
});
