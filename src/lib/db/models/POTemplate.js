import mongoose from "mongoose";

const { Schema } = mongoose;

const poTemplateSchema = new Schema(
  {
    templateName: { 
      type: String, 
      required: [true, "Template Name is required"], 
      trim: true 
    },
    supplier: { 
      type: Schema.Types.ObjectId, 
      ref: "Supplier", 
      required: [true, "Supplier is required"] 
    },
    headers: [
      { type: String, required: true }
    ],
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

const POTemplate = mongoose.models.POTemplate || mongoose.model("POTemplate", poTemplateSchema);
export default POTemplate;
