"use strict";
import { Schema } from "mongoose";

// Definir el esquema de permiso
const permissionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
    },
    user: [{ type: Schema.Types.ObjectId, ref: "user" }],
  },
  {
    timestamps: true,
  }
);

// Middleware para convertir a minúsculas antes de guardar
permissionSchema.pre('save', function (next) {
  this.name = this.name.toLowerCase();
  this.method = this.method.toLowerCase();
  next();
});

// Índice compuesto para asegurar que la combinación de name y method sea única
permissionSchema.index({ name: 1, method: 1 }, { unique: true });

permissionSchema.statics.isProtected = function (method) {
  const protectedMethods = [
    "get",
    "post",
    "put",
    "delete",
    "createBatch",
    "updateBatch",
    "post"
  ]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Exportar el modelo de permiso
export default permissionSchema;
