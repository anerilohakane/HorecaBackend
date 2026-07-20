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
    headers: { type: mongoose.Schema.Types.Mixed },
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

// Force reload of schema in Next.js hot-reloading
if (mongoose.models.ClaimTemplate) {
  delete mongoose.models.ClaimTemplate;
}

const ClaimTemplate = mongoose.model("ClaimTemplate", claimTemplateSchema);
export default ClaimTemplate;
