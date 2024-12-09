"use strict";

import mongoose from "mongoose";
const { Schema } = mongoose;

const optionsSchema = new Schema(
  {
    group: { type: String, required: true },
    options: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true },
        customOther: { type: String, default: null }, // Si hay opciones personalizadas
      },
    ],
  },
  { timestamps: true }
);

export const Settings = mongoose.model("Settings", optionsSchema);
