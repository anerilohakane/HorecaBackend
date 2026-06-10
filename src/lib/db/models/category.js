import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // or an object if you use { url, publicId }
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    handlingFee: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for subcategories (children)
CategorySchema.virtual("subcategories", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

CategorySchema.set("toObject", { virtuals: true });
CategorySchema.set("toJSON", { virtuals: true });

delete mongoose.models.Category;

const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
export default Category;
