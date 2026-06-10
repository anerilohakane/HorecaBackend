import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import Setting from "@/lib/db/models/Setting";

export async function GET(request) {
  await dbConnect();
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");

    if (key) {
      const setting = await Setting.findOne({ key }).lean();
      return NextResponse.json({ success: true, data: setting ? setting.value : null });
    }

    const settings = await Setting.find({}).lean();
    return NextResponse.json({ success: true, data: settings });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  await dbConnect();
  try {
    const { key, value, description } = await request.json();

    if (!key || value === undefined) {
      return NextResponse.json({ success: false, error: "Key and value are required" }, { status: 400 });
    }

    const setting = await Setting.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: setting });
  } catch (err) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
