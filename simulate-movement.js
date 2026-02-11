// Polling Simulation: Updates Database via API
const ORDER_ID = "6981a1460dde1bb68d030310"; // Order in 'out_for_delivery' status
const API_URL = "http://localhost:3001/api/driver/" + ORDER_ID;

// Route: From Noida Sector 18 TO Connaught Place (Delivering TOWARDS current location)
const start = { lat: 28.5708, lng: 77.3271 };   // Noida Sector 18 (Start)
const end = { lat: 28.6304, lng: 77.2177 };     // Connaught Place (Destination)

let currentLat = start.lat;
let currentLng = start.lng;
const totalSteps = 200; 
const stepLat = (end.lat - start.lat) / totalSteps;
const stepLng = (end.lng - start.lng) / totalSteps;
let step = 0;

console.log(`🚀 Starting Polling Simulation for Order: ${ORDER_ID}`);
console.log(`📡 Target API: ${API_URL}`);

async function updateLocation() {
    // Update coordinates
    currentLat += stepLat;
    currentLng += stepLng;
    step++;

    // Calculate Bearing
    const bearing = calculateBearing(currentLat, currentLng, end.lat, end.lng);

    // Reset if reached end
    if (step > totalSteps) {
        console.log("🔄 Reached destination, restarting route...");
        currentLat = start.lat;
        currentLng = start.lng;
        step = 0;
    }

    const payload = {
        lat: currentLat,
        lng: currentLng,
        bearing: bearing
    };

    try {
        const res = await fetch(API_URL, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        const text = await res.text();
        
        if (res.ok) {
            try {
                const json = JSON.parse(text);
                if (json.success) {
                    console.log(`✅ Updated: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)} (Bearing: ${bearing.toFixed(0)}°)`);
                } else {
                    console.error(`❌ Update Failed:`, json);
                }
            } catch (e) {
                console.error(`🚨 JSON Parse Error. Status: ${res.status}. Response:`, text.substring(0, 200));
            }
        } else {
            console.error(`🚨 HTTP Error: ${res.status} ${res.statusText}`);
            console.error(`Response Preview:`, text.substring(0, 200));
        }

    } catch (err) {
        console.error(`🚨 Fetch Error:`, err.message);
    }
}

// Run every 3 seconds (Polling Interval)
setInterval(updateLocation, 3000); 

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
