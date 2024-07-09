'use strict';
import { Schema } from "mongoose";

// Definir el esquema de role
const roleuserSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  permisos: [{ type: Schema.Types.ObjectId, ref: 'permission' }],
  orden: { type: Number,unique: true}
},
{
  timestamps: true,
});
roleuserSchema.statics.isProtected = function (method) {
  const protectedMethods = [
    "get",
    "post",
    "put",
    "delete",
    "createBatch",
    "updateBatch",    
  ]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Exportar el modelo de role
export {roleuserSchema};