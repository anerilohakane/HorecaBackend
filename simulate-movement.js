const io = require("socket.io-client");

// Connect to local socket server
const socket = io("http://localhost:4000");

// Route: From CP (Delhi) to Noida Sector 18 (Rough approximated coords)
const start = { lat: 28.6304, lng: 77.2177 }; // Connaught Place
const end = { lat: 28.5708, lng: 77.3271 };   // Noida Sector 18

let currentLat = start.lat;
let currentLng = start.lng;
const totalSteps = 200; // More steps = smoother/slower simulation
const stepLat = (end.lat - start.lat) / totalSteps;
const stepLng = (end.lng - start.lng) / totalSteps;
let step = 0;

socket.on("connect", () => {
  console.log("✅ Simulation connected to socket server");
  
  // Start emitting updates
  setInterval(() => {
    // Update coordinates
    currentLat += stepLat;
    currentLng += stepLng;
    step++;

    // Calculate Bearing (Basic)
    const bearing = calculateBearing(currentLat, currentLng, end.lat, end.lng);

    // Reset if reached end
    if (step > totalSteps) {
        console.log("🔄 Reached destination, restarting route...");
        currentLat = start.lat;
        currentLng = start.lng;
        step = 0;
    }

    const data = {
        orderId: "ORDER_12345", 
        lat: currentLat,
        lng: currentLng,
        bearing: bearing, 
        status: "out_for_delivery"
    };

    console.log(`📡 Emitting: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`);
    socket.emit("updateLocation", data);

  }, 1000); // Update every 1 second
});

socket.on("disconnect", () => {
    console.log("❌ Disconnected from server");
});

// Helper to calculate bearing between two points
function toRad(deg) {
    return deg * Math.PI / 180;
}

function toDeg(rad) {
    return rad * 180 / Math.PI;
}

function calculateBearing(lat1, lng1, lat2, lng2) {
    const dLng = toRad(lng2 - lng1);
    const lat1Rad = toRad(lat1);
    const lat2Rad = toRad(lat2);

    const y = Math.sin(dLng) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);
              
    let brng = toDeg(Math.atan2(y, x));
    return (brng + 360) % 360;
}
