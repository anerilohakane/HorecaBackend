
// Simulate the backend logic exactly
const body = {
    startDate: "2026-01-20T12:53:56.878Z", // from DB screenshot
    preferredTime: "18:25",
    timezoneOffset: -330 // IST
};

const now = new Date();

console.log("--- Inputs ---");
console.log("startDate (body):", body.startDate);
console.log("preferredTime:", body.preferredTime);
console.log("timezoneOffset:", body.timezoneOffset);

// Logic from route.js
const sDate = new Date(body.startDate);
const y = sDate.getUTCFullYear();
const mo = sDate.getUTCMonth();
const d = sDate.getUTCDate();

console.log(`UTC Parsed: Y=${y}, M=${mo}, D=${d}`);

let h = 9;
let m = 0;
if (body.preferredTime) {
    const parts = body.preferredTime.split(':').map(Number);
    if (!isNaN(parts[0])) h = parts[0];
    if (!isNaN(parts[1])) m = parts[1];
}

console.log(`Time Parsed: H=${h}, M=${m}`);

// Date.UTC(2026, 0, 20, 18, 25, 0)
// This constructs 2026-01-20T18:25:00.000Z
const baseTimestamp = Date.UTC(y, mo, d, h, m, 0);
console.log("baseTimestamp (UTC string):", new Date(baseTimestamp).toISOString());

let finalTimestamp = baseTimestamp;

// Logic: final = base + (offset * 60000)
// If offset is -330 (IST).
// final = 18:25 UTC + (-330m) = 18:25 - 5.5h = 12:55 UTC.
if (body.timezoneOffset !== undefined) {
     finalTimestamp = baseTimestamp + (Number(body.timezoneOffset) * 60000);
     console.log(`Applied Offset (${body.timezoneOffset}): ${Number(body.timezoneOffset) * 60000} ms`);
}

const nextDate = new Date(finalTimestamp);
console.log("--- Result ---");
console.log("Calculated NextOrderDate (UTC):", nextDate.toISOString());
console.log("Expected (12:55 UTC):         2026-01-20T12:55:00.000Z");

// Simulate "Fallback" if startDate was NOT provided (Logic flow check)
// But it WAS provided. So we skip fallback.

// Check if "nextDate <= now"?
// Route logic for "startDate provided" DOES NOT HAVE a check for "if (nextDate <= now) add 7 days".
// Ah! Look at lines 80-104 in route.js. That is inside `else` block of `if (body.startDate)`.
// So if startDate is present, we blindly trust the calculation without checking if it's in the past.

// Wait.
// If calculated is `12:55 UTC`. And `now` (at creation) was `12:53 UTC`.
// 12:55 > 12:53. So it is FUTURE.
// So it should be scheduled for TODAY (20th).

// If the DB has `18:39 UTC`.
// How did we get 18:39?
// 18:39 is 18:25 + 14 minutes.
// This implies `baseTimestamp` (18:25) + `+14 minutes` offset.
// Is it possible the Frontend sent `timezoneOffset` as `14`?
