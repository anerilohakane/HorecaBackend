
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Notification from '@/lib/db/models/notification';

export async function GET(request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
             return NextResponse.json({ success: false, error: "UserId required" }, { status: 400 });
        }

        const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: notifications });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    await dbConnect();
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
         if (!userId) {
             return NextResponse.json({ success: false, error: "UserId required" }, { status: 400 });
        }
        await Notification.deleteMany({ user: userId });
        return NextResponse.json({ success: true, message: "Cleared all notifications" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
