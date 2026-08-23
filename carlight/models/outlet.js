import { Schema, model, models } from 'mongoose';

const OutletSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Outlet name is required!'],
  },
  address: {
    type: String,
    required: [true, 'Address is required!'],
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

const Outlet = models.Outlet || model("Outlet", OutletSchema);

export default Outlet;
