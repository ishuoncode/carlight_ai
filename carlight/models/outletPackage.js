import { Schema, model, models } from 'mongoose';

const OutletPackageSchema = new Schema({
  outlet: {
    type: Schema.Types.ObjectId,
    ref: 'Outlet',
    required: [true, 'Outlet is required!'],
  },
  washPackage: {
    type: Schema.Types.ObjectId,
    ref: 'WashPackage',
    required: [true, 'Wash package is required!'],
  },
  price: {
    type: Number,
    required: [true, 'Price is required!'],
    min: [0, 'Price cannot be negative'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index to prevent duplicate outlet-package combinations
OutletPackageSchema.index({ outlet: 1, washPackage: 1 }, { unique: true });

const OutletPackage = models.OutletPackage || model("OutletPackage", OutletPackageSchema);

export default OutletPackage;
