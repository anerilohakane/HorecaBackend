import mongoose from "mongoose";

const warehouseLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["WAREHOUSE", "FLOOR", "BLOCK", "RACK", "SHELF", "BIN"],
    },
    level: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WarehouseLocation",
      default: null,
    },
    path: {
      type: String,
      default: "",
    },
    ancestors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "WarehouseLocation",
      },
    ],
    capacity: {
      type: Number,
      default: 0,
    },
    currentQuantity: {
      type: Number,
      default: 0,
    },
    barcode: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active",
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

warehouseLocationSchema.index({ parentId: 1 });
warehouseLocationSchema.index({ type: 1 });
warehouseLocationSchema.index({ status: 1 });
warehouseLocationSchema.index({ ancestors: 1 });
warehouseLocationSchema.index({ name: "text" });

const TYPE_HIERARCHY = {
  WAREHOUSE: { level: 0, allowedChildren: ["FLOOR", "BLOCK"] },
  FLOOR: { level: 1, allowedChildren: ["BLOCK"] },
  BLOCK: { level: 2, allowedChildren: ["RACK"] },
  RACK: { level: 3, allowedChildren: ["SHELF"] },
  SHELF: { level: 4, allowedChildren: ["BIN"] },
  BIN: { level: 5, allowedChildren: [] },
};

warehouseLocationSchema.statics.TYPE_HIERARCHY = TYPE_HIERARCHY;

warehouseLocationSchema.pre("save", async function (next) {
  if (!this.barcode) {
    const prefix = this.type.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.barcode = `WH-${prefix}-${timestamp}-${random}`;
  }

  if (this.isModified("name") || this.isModified("parentId")) {
    if (this.parentId) {
      const parent = await this.constructor.findById(this.parentId);
      if (parent) {
        this.ancestors = [...parent.ancestors, parent._id];
        this.path = parent.path ? `${parent.path} > ${this.name}` : `${parent.name} > ${this.name}`;
      }
    } else {
      this.ancestors = [];
      this.path = this.name;
    }
  }
  next();
});

if (mongoose.models.WarehouseLocation) {
  delete mongoose.models.WarehouseLocation;
}

export default mongoose.models.WarehouseLocation ||
  mongoose.model("WarehouseLocation", warehouseLocationSchema);
