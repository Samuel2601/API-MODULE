"use strict";

import { Settings } from "../models/settings.model.js";

// Crear EN MASA configuración
async function bulkCreate(settingsData) {
  try {
    // Inserta todos los registros en una sola operación
    const result = await Settings.insertMany(settingsData, { ordered: true });
    return result;
  } catch (error) {
    throw new Error(`Error al crear registros en masa: ${error.message}`);
  }
}
// Crear una nueva configuración
async function createSetting(group, options) {
  const setting = new Settings({
    group,
    options,
  });

  await setting.save();
  return setting;
}

// Obtener todas las configuraciones
async function getAllSettings() {
  return await Settings.find();
}

// Obtener configuración por ID
async function getSettingById(id) {
  return await Settings.findById(id);
}

// Actualizar configuración por ID
async function updateSetting(id, updates) {
  return await Settings.findByIdAndUpdate(id, updates, { new: true });
}

// Eliminar configuración por ID
async function deleteSetting(id) {
  return await Settings.findByIdAndDelete(id);
}

export {
  bulkCreate,
  createSetting,
  getAllSettings,
  getSettingById,
  updateSetting,
  deleteSetting,
};
