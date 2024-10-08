import mongoose, { Schema, InferSchemaType, model } from 'mongoose'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [emailRegex, 'Please provide a valid email address']
    },
    full_name: { type: String, required: true },
    password: { type: String, required: true },
    confirmed: { type: Boolean, default: false },
    role: { type: String, enum: ['admin', 'guest', 'none'], default: 'none' },
    room_id: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: false
    },
    shifts: [{ type: Schema.Types.ObjectId, ref: 'Shift' }],
    refresh_token: { type: String, required: false }
  },
  {
    timestamps: true
  }
)

type User = InferSchemaType<typeof userSchema>
type UserWithId = User & {
  _id: mongoose.Types.ObjectId
}
const UserModel = model('User', userSchema)

export { User, UserModel, userSchema, UserWithId }
