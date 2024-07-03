"use strict";

import mongoose from "mongoose";
import connectDB from "../../database/connect.js";
await connectDB("buzon");
const { Schema } = mongoose;

// Definición del esquema para el modelo de Usuario
const UsuarioSchema = new Schema({
  cedula: { type: String, required: true, unique: true },
  nombres: { type: String, required: true },
  telefono: { type: String, required: true },
  rol_user: { type: Schema.Types.ObjectId, ref: "rol_user", required: true },
  correo: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  foto: { type: String },
  estado: { type: String, default: "On" },
  createdAt: { type: Date, default: Date.now, require: true },
});
UsuarioSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Rol_user
const RolUserSchema = new Schema({
  nombre: { type: String },
  orden: { type: Number, unique: true },
  createdAt: { type: Date, default: Date.now, require: true },
});
RolUserSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Ficha_sectorial
//categoria: { type: Schema.Types.ObjectId, ref: 'categoria', required: true },
const FichaSectorialSchema = new Schema({
  descripcion: { type: String, required: true },
  encargado: { type: Schema.Types.ObjectId, ref: "usuario", required: true },
  direccion_geo: { type: String, require: true },
  estado: { type: Schema.Types.ObjectId, ref: "estado_actividad_proyecto" },
  actividad: { type: Schema.Types.ObjectId, ref: "actividad_proyecto" },
  fecha_evento: { type: Date },
  observacion: { type: String },
  foto: [{ type: String }],
  view: { type: Boolean, default: true },
  view_id: { type: Schema.Types.ObjectId, ref: "usuario" },
  view_date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, require: true },
});
FichaSectorialSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Incidentes_denuncia
const IncidentesDenunciaSchema = new Schema({
  categoria: { type: Schema.Types.ObjectId, ref: "categoria", required: true },
  subcategoria: {
    type: Schema.Types.ObjectId,
    ref: "subcategoria",
    required: true,
  },
  direccion_geo: {
    nombre: { type: String, required: true },
    latitud: { type: Number, required: true },
    longitud: { type: Number, required: true },
  },
  ciudadano: { type: Schema.Types.ObjectId, ref: "usuario", required: true },
  estado: { type: Schema.Types.ObjectId, ref: "estado_incidente" },
  foto: [{ type: String }],
  descripcion: { type: String, required: true },
  encargado: { type: Schema.Types.ObjectId, ref: "usuario" },
  respuesta: { type: String },
  evidencia: [{ type: String }],
  view: { type: Boolean, default: true },
  view_id: { type: Schema.Types.ObjectId, ref: "usuario" },
  view_date: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now, require: true },
});
IncidentesDenunciaSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Categoria
const CategoriaSchema = new Schema({
  nombre: { type: String, required: true },
  descripcion: { type: String, required: true },
  icono: { type: String },
});
CategoriaSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Subcategoria
const SubcategoriaSchema = new Schema({
  categoria: { type: Schema.Types.ObjectId, ref: "categoria", require: true },
  nombre: { type: String, require: true },
  descripcion: { type: String, require: true },
  icono: { type: String },
});
SubcategoriaSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Encargado_categoria
const EncargadoCategoriaSchema = new Schema({
  encargado: [{ type: Schema.Types.ObjectId, ref: "usuario" }],
  categoria: { type: Schema.Types.ObjectId, ref: "categoria" },
  createdAt: { type: Date, default: Date.now, require: true },
});
EncargadoCategoriaSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Estado_incidente
const EstadoIncidenteSchema = new Schema({
  nombre: { type: String, unique: true },
  orden: { type: Number, required: true },
});
EstadoIncidenteSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Estado_actividad_proyecto
const EstadoActividadProyectoSchema = new Schema({
  nombre: { type: String, unique: true },
  orden: { type: Number, required: false },
});
EstadoActividadProyectoSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Actividad_proyecto
const ActividadProyectoSchema = new Schema({
  nombre: { type: String },
  icono: { type: String },
  createdAt: { type: Date, default: Date.now, require: true },
});
ActividadProyectoSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Definición del esquema para el modelo de Direccion_geo
const DireccionGeoSchema = new Schema({
  nombre: { type: String },
  latitud: { type: Number },
  longitud: { type: Number },
});
DireccionGeoSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
const permisosSchema = new Schema({
  nombreComponente: {
    type: String,
    required: true,
  },
  rolesPermitidos: [
    {
      type: Schema.Types.ObjectId,
      ref: "rol_user",
      required: true,
    },
  ],
});
permisosSchema.statics.isProtected = function (method) {
  const protectedMethods = ["get", "put", "delete", "post"]; // método 'post' libre
  return protectedMethods.includes(method);
};
const RecolectoresSchema = new Schema({
  id_api: { type: String },
  nombre: { type: String },
  comentarios: [
    {
      ciudadano: { type: Schema.Types.ObjectId, ref: "usuario" },
      puntuacion: { type: Number },
      descripcion: { type: String, required: true },
    },
  ],
});
RecolectoresSchema.statics.isProtected = function (method) {
  const protectedMethods = [
    "get",
    "put",
    "delete",
    "createBatch",
    "updateBatch",
  ]; // método 'post' libre
  return protectedMethods.includes(method);
};
const RequestSchema = new Schema(
  {
    dni: { type: String, required: true }, // Consider renaming to idNumber or similar
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    email: { type: String, required: true },
    issueDescription: { type: String, required: true },
    assignees: { type: Schema.Types.ObjectId, ref: "usuario", required: true },
    foto: [{ type: String }],
    evidencia: [{ type: String }],
  },
  {
    timestamps: true,
  }
);
RequestSchema.statics.isProtected = function (method) {
  const protectedMethods = [
    "get",
    "put",
    "delete",
    "createBatch",
    "updateBatch",
  ]; // método 'post' libre
  return protectedMethods.includes(method);
};
// Exportar los esquemas
// Exportar los esquemas

export const models = {
  Permiso : mongoose.model("Permisos", permisosSchema),
  Usuario : mongoose.model("usuario", UsuarioSchema),
  Ficha_sectorial : mongoose.model(
   "ficha_sectorial",
   FichaSectorialSchema
 ),
  Incidentes_denuncia : mongoose.model(
   "incidentes_denuncia",
   IncidentesDenunciaSchema
 ),
  Categoria : mongoose.model("categoria", CategoriaSchema),
  Subcategoria : mongoose.model("subcategoria", SubcategoriaSchema),
  Encargado_categoria : mongoose.model(
   "encargado_categoria",
   EncargadoCategoriaSchema
 ),
  Rol_user : mongoose.model("rol_user", RolUserSchema),
  Estado_incidente : mongoose.model(
   "estado_incidente",
   EstadoIncidenteSchema
 ),
  Estado_actividad_proyecto : mongoose.model(
   "estado_actividad_proyecto",
   EstadoActividadProyectoSchema
 ),
  Actividad_proyecto : mongoose.model(
   "actividad_proyecto",
   ActividadProyectoSchema
 ),
  Direccion_geo : mongoose.model(
   "direccion_geo",
   DireccionGeoSchema
 ),
  Recolector : mongoose.model("recolector", RecolectoresSchema),
  Request : mongoose.model("Request", RequestSchema),
};


