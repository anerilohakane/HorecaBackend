const { Server } = require("socket.io");

const io = new Server(4000, {
  cors: {
    origin: "*", // Allow all connections (configure for production later)
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Listen for location updates from driver app or simulation
  socket.on("updateLocation", (data) => {
    // data expected format: { orderId, lat, lng, bearing, status }
    console.log(`📍 Location Update [${data.orderId}]:`, data.lat, data.lng);

    // Broadcast to all clients (in a real app, emit to specific room: `io.to(orderId).emit(...)`)
    io.emit("driverLocationUpdate", data);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

console.log("🚀 Socket.io server running on port 4000");
