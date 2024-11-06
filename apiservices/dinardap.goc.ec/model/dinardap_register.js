"use strict";

import mongoose from "mongoose";

const { Schema } = mongoose;

// Esquema para almacenar la información del paquete
const PaqueteSchema = new Schema(
  {
    codigoPaquete: { type: String, required: true },
    datos: {}, // Almacenamos los campos de la respuesta como clave-valor
  },
  {
    timestamps: true,
  }
);

// Esquema para la cédula o RUC
const CedulaSchema = new Schema({
  identificacion: { type: String, unique: true, required: true }, // Cédula o RUC único
  paquetes: [PaqueteSchema], // Array de resultados de cada paquete
});

export const Cedula = mongoose.model("dinardap_register", CedulaSchema);
