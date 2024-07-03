'use strict'

import mongoose from 'mongoose';
const { Schema } = mongoose;

const RegistroSchema = new Schema({
    usuario: { type: Schema.ObjectId, ref: 'usuario', required: true },
    tipo: { type: String, required: true },
    descripcion: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true }
});

export default mongoose.model('registro', RegistroSchema);
