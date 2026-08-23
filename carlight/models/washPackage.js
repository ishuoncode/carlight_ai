import { Schema, model, models } from 'mongoose';

const WashPackageSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Package name is required!'],
  },
  description: {
    type: String,
    required: [true, 'Description is required!'],
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WashPackage = models.WashPackage || model("WashPackage", WashPackageSchema);

export default WashPackage;
