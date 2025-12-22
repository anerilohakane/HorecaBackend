import mongoose from "mongoose";
const { Schema } = mongoose;

const cartItemSchema = new Schema({
  productId: { 
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
},
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
},
  addedAt: { 
    type: Date, 
    default: Date.now 
},
  // snapshot of price/name at time of add to cart
  name: String,
  price: Number,
  thumbnail: String,
  unit: String
}, { _id: false });

const cartSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    index: true, 
    unique: true 
},
  items: { 
    type: [cartItemSchema], 
    default: [] 
},
  // optional totals cached for quick access (can be recalculated)
  subtotal: { 
    type: Number, 
    default: 0 
},
  updatedAt: { 
    type: Date, 
    default: Date.now 
}
}, { timestamps: true });

export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
