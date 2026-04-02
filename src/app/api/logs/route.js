import dbConnect from "@/lib/db/connect";
import Log from "@/lib/db/models/Log";

const json = (payload, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const userId = searchParams.get("userId");
    const action = searchParams.get("action");
    const level = searchParams.get("level");
    const limit = parseInt(searchParams.get("limit") || "100");
    const page = parseInt(searchParams.get("page") || "1");

    const query = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (level) query.level = level;

    const skip = (page - 1) * limit;

    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email phone")
      .lean();

    const totalCount = await Log.countDocuments(query);

    return json({
      success: true,
      logs,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (err) {
    console.error("GET /api/logs error:", err);
    return json({ success: false, error: err.message || "Server error" }, 500);
  }
}
