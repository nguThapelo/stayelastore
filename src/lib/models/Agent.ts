import mongoose, { Schema, models, Document } from 'mongoose';

export interface IAgent extends Document {
  phone: string;
  name: string;
  location: string;
  level: 'bronze' | 'silver' | 'gold';
  balance: number;
  transactions: number;
}

const agentSchema: Schema<IAgent> = new Schema({
  phone: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true, trim: true },
  level: { type: String, enum: ['bronze', 'silver', 'gold'], default: 'bronze' },
  balance: { type: Number, default: 0, min: 0 },
  transactions: { type: Number, default: 0, min: 0 },
}, {
  timestamps: true,
});

export const Agent = models.Agent || mongoose.model<IAgent>('Agent', agentSchema);
