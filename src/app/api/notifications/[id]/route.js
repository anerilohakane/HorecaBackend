
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import Notification from '@/lib/db/models/notification';

export async function PATCH(request, { params }) {
    await dbConnect();
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = await Notification.findByIdAndUpdate(id, body, { new: true });
        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    await dbConnect();
    try {
        const { id } = await params;
        await Notification.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: "Deleted" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
