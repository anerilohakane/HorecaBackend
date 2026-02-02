const mongoose = require('mongoose');
// Ad-hoc model for test (to match src/lib/db/models/notification.js)
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["info", "warning", "error", "success"], default: "info" },
    isRead: { type: Boolean, default: false },
    metadata: { type: Object }
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

const MONGODB_URI = "mongodb+srv://chaitanyakhairmodedelxn_db_user:root%40123@cluster0.2muyghy.mongodb.net/?appName=Cluster0";

async function testNotif() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("🔌 Connected to DB");

        const userId = new mongoose.Types.ObjectId();
        console.log(`Creating notification for fake user: ${userId}`);

        const notif = await Notification.create({
            user: userId,
            title: "Test Notification",
            message: "This is a test message from local script.",
            type: "info",
            metadata: { foo: "bar" }
        });

        console.log(`✅ Notification Created! ID: ${notif._id}`);

        const found = await Notification.findById(notif._id);
        if (found && found.message === "This is a test message from local script.") {
            console.log("✅ Verification SUCCESS: Read back correct data.");
            
            // Cleanup
            await Notification.deleteOne({ _id: notif._id });
            console.log("🧹 Cleanup done.");
        } else {
            console.log("❌ Verification FAILED: Could not find or match data.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

testNotif();
