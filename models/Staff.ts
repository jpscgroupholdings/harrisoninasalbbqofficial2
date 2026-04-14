import mongoose from "mongoose";

export type StaffRole = "superadmin" | "admin" | "cashier";

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
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please fill a valid email address",
      ],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{10,15}$/, "Invalid phone number!"],
    },
    role: {
      type: String,
      enum: ["superadmin", "admin", "cashier"],
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

staffSchema.index({ email: 1 }, { unique: true });

const Staff =
  mongoose.models.Staff || mongoose.model<IStaff>("Staff", staffSchema);

export default Staff;
