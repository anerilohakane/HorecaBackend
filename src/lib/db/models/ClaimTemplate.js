import mongoose from "mongoose";

const { Schema } = mongoose;

const claimTemplateSchema = new Schema(
  {
    name: { 
      type: String, 
      required: [true, "Template Name is required"], 
      trim: true 
    },
    type: {
      type: String,
      enum: ["PLUS_MINUS", "PRIMARY", "SECONDARY", "REVERSE"],
      required: [true, "Claim Type is required"]
    },
    fields: [
      { type: String, required: true }
    ],
    fileUrl: {
      type: String
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  { timestamps: true }
);

const ClaimTemplate = mongoose.models.ClaimTemplate || mongoose.model("ClaimTemplate", claimTemplateSchema);
export default ClaimTemplate;
