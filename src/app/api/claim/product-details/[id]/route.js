import { NextResponse } from "next/server";
import connectDB from "@/lib/db/connect";
import Product from "@/lib/db/models/product";
import Supplier from "@/lib/db/models/supplier";

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const product = await Product.findById(id).populate("supplierId");
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const supplier = product.supplierId;
    if (!supplier) {
      return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        product: {
           _id: product._id,
           name: product.name,
           sku: product.sku,
           basePrice: product.basePrice,
           assuredMargin: product.assuredMargin
        },
        supplier: {
           _id: supplier._id,
           businessName: supplier.businessName,
           salesPersons: supplier.salesPersons || []
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
