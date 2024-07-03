"use strict";
import { model } from "mongoose";
import { roleuserSchema } from "./rolUserSchema.js";
import { userSchema } from "./userSchema.js";
import permisoSchema from "./permisoSchema.js";

import connectDB from '../../database/connect.js';
await connectDB();

export const Model = {
  User: model("user", userSchema),
  Role: model("role", roleuserSchema),
  Permiso: model("permiso", permisoSchema),
};
