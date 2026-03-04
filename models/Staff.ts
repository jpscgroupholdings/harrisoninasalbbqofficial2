import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export type StaffRole = "branch_manager" | "stock_manager" | "cashier";

export interface IStaff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: StaffRole;
  branch: mongoose.Schema.Types.ObjectId;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const staffSchema = new mongoose.Schema<IStaff>(
  {
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["branch_manager", "stock_manager", "cashier"],
      required: [true, "Role is required"],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch assignment is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);


const Staff =
  mongoose.models.Staff || mongoose.model<IStaff>("Staff", staffSchema);

export default Staff;