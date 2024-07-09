"use strict";
import { Schema } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true, description: "Name User Module"},
  last_name: {
    type: String,
    // required: true
    description: "LastName User Module"
  },
  dni: {
    type: String,
    //required: false,
    trim: true,
    //unique: true,
    lowercase: true,
    //index: { unique: true },
    description: "Identification User Module"
  },
  telf: {
    type: String, //required: true
    description: "Telf User Module"
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true,
    index: { unique: true },
    description: "Email User Module"
  },
  password: {
    type: String,
    //required: true,
    description: "Password no require for User Module [Facebook, Google]"
  },
  verificado: { type: Boolean, default: false },
  status: { type: Boolean, default: true, require: true },
  role: { type: Schema.Types.ObjectId, ref: "role", required: true },
  googleId: {
    type: String,
    default: null,
  },
  facebookId: {
    type: String,
    default: null,
  },
  photo: {
    type: String,
    default: null,
  },
  verificationCode: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now, require: true },
  password_temp: { type: String },
},
{
  timestamps: true,
});
userSchema.statics.isProtected = function (method) {
  const protectedMethods = [
    "get",
    "put",
    "delete",
    "createBatch",
    "updateBatch",
  ]; // método 'post' libre
  return protectedMethods.includes(method);
};
export { userSchema };
