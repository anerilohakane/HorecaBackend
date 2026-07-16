import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connect';
import ProductRequest from '@/lib/db/models/ProductRequest';
import Product from '@/lib/db/models/product';

export async function PUT(request, context) {
  try {
    await dbConnect();
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { action, cctRemarks, isColdStorage = false, margin = 0 } = body; // action: 'approve' | 'reject'

    const productReq = await ProductRequest.findById(id);
    if (!productReq) {
      return NextResponse.json({ success: false, message: 'Request not found' }, { status: 404 });
    }

    if (action === 'approve') {
      productReq.status = 'Approved';
      productReq.cctRemarks = cctRemarks || 'Approved by CCT';
      await productReq.save();

      // Create a new product in the Product collection
      // For categoryId, we might need a dummy one if it wasn't valid, but let's assume it was valid or we just set it as null
      // Calculate final price based on margin
      const finalPrice = margin > 0 ? productReq.price + (productReq.price * (margin / 100)) : productReq.price;

      const newProduct = new Product({
        supplierId: productReq.supplierId,
        name: productReq.name,
        description: productReq.description,
        basePrice: productReq.price,
        price: finalPrice,
        assuredMargin: margin,
        isColdStorage: isColdStorage,
        unit: productReq.unit,
        stockQuantity: productReq.stockQuantity || 0,
        images: productReq.images.map(img => ({
          url: img.url,
          publicId: img.publicId || "pending_public_id",
          isMain: img.isMain || false
        })),
        categoryId: productReq.categoryId || "000000000000000000000000", // Fallback if missing
        isActive: true,
      });

      await newProduct.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Product request approved and product created successfully',
        data: productReq 
      });

    } else if (action === 'reject') {
      productReq.status = 'Rejected';
      productReq.cctRemarks = cctRemarks || 'Rejected by CCT';
      await productReq.save();

      return NextResponse.json({ 
        success: true, 
        message: 'Product request rejected',
        data: productReq 
      });
    } else {
      return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error("Error updating product request:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
