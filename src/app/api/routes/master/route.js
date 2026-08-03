import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import RouteMaster from "@/lib/db/models/RouteMaster";

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "Active";
    const pincode = searchParams.get("pincode");

    let query = {};
    if (status) query.status = status;
    if (pincode && pincode.trim()) {
      query.coveragePincodes = pincode.trim();
    }

    const routeMasters = await RouteMaster.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: routeMasters,
    }, { status: 200 });
  } catch (error) {
    console.error("Error in HorecaBackend route masters GET:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to fetch route masters",
    }, { status: 500 });
  }
}
