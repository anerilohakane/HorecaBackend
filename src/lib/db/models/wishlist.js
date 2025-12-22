import mongoose from "mongoose";
const { Schema } = mongoose;

const wishlistItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
},
  addedAt: { 
    type: Date, 
    default: Date.now 
},
  // snapshot fields (optional but recommended)
  name: String,
  price: Number,
  thumbnail: String,
}, { _id: false });

const wishlistSchema = new Schema({
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true, 
    index: true, 
    unique: true 
},
  items: { 
    type: [wishlistItemSchema], 
    default: [] 
}
}, { timestamps: true });

export default mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
