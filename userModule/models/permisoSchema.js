"use strict";
import { Schema } from "mongoose";

// Definir el esquema de permiso
const permisoSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    user: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  {
    timestamps: true,
  }
);

// Exportar el modelo de permiso
export default permisoSchema;
