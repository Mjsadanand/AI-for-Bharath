import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'doctor' | 'patient' | 'researcher' | 'admin';
  specialization?: string;
  licenseNumber?: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  authProvider: 'local' | 'google';
  googleId?: string;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false }, // Not required for Google OAuth users
    role: {
      type: String,
      enum: ['doctor', 'patient', 'researcher', 'admin'],
      default: 'patient', // Default role; Google OAuth users select role post-signup
    },
    specialization: { type: String },
    licenseNumber: { type: String },
    phone: { type: String },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
    isProfileComplete: { type: Boolean, default: true }, // false for new Google OAuth users
  },
  { timestamps: true }
);

// Hash password before saving (only for local auth users)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false; // Google OAuth users have no password
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
