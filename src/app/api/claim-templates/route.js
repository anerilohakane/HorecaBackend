import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import ClaimTemplate from "@/lib/db/models/ClaimTemplate";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    
    let query = {};
    if (type) query.type = type;

    const templates = await ClaimTemplate.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    
    const template = new ClaimTemplate(body);
    await template.save();

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
