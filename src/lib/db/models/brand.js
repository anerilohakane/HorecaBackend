// /models/Brand.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const imageSubSchema = new Schema({
  url: { type: String },
  publicId: { type: String }
}, { _id: false });

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      unique: true
    },
    description: {
      type: String,
      trim: true
    },
    image: imageSubSchema,
    isActive: {
      type: Boolean,
      default: true
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      default: null
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin"
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

delete mongoose.models.Brand;
const Brand = mongoose.models.Brand || mongoose.model("Brand", brandSchema, "categories");
export default Brand;
