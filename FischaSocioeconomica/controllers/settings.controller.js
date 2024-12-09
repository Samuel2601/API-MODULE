"use strict";
import express from "express";
import {
  bulkCreate,
  createSetting,
  deleteSetting,
  getAllSettings,
  getSettingById,
  updateSetting,
} from "../service/settings.service.js";

const router_setting_ficha_sectorial = express.Router();

router_setting_ficha_sectorial.post(
  "/settings-ficha-socioeconomica/bulkCreate",
  async (req, res) => {
    try {
      const settingsData = req.body;
      console.log("settingsData", settingsData);
      // Transformar el objeto en un array
      const transformedArray = Object.entries(settingsData).map(
        ([key, options]) => ({
          group: key,
          options,
        })
      );
      // Validación básica
      if (!Array.isArray(transformedArray) || transformedArray.length === 0) {
        return res.status(400).json({
          message:
            "El cuerpo de la solicitud debe ser un arreglo de registros.",
        });
      }

      // Llama al servicio para insertar los registros
      const result = await bulkCreate(transformedArray);
      return res
        .status(201)
        .json({ message: "Registros creados exitosamente.", data: result });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
);

// Crear configuración
router_setting_ficha_sectorial.post(
  "/settings-ficha-socioeconomica",
  async (req, res) => {
    const { group, options } = req.body;
    try {
      const setting = await createSetting(group, options);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ error: "Error creando la configuración" });
    }
  }
);

// Obtener todas las configuraciones
router_setting_ficha_sectorial.get(
  "/settings-ficha-socioeconomica",
  async (req, res) => {
    try {
      const settings = await getAllSettings();
      res.status(200).json(settings);
    } catch (error) {
      res.status(400).json({ error: "Error obteniendo configuraciones" });
    }
  }
);

// Obtener configuración por ID
router_setting_ficha_sectorial.get(
  "/settings-ficha-socioeconomica/:id",
  async (req, res) => {
    const { id } = req.params;
    try {
      const setting = await getSettingById(id);
      if (!setting) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.status(200).json(setting);
    } catch (error) {
      res.status(400).json({ error: "Error obteniendo la configuración" });
    }
  }
);

// Actualizar configuración por ID
router_setting_ficha_sectorial.put(
  "/settings-ficha-socioeconomica/:id",
  async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    try {
      const updatedSetting = await updateSetting(id, updates);
      if (!updatedSetting) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.status(200).json(updatedSetting);
    } catch (error) {
      res.status(400).json({ error: "Error actualizando la configuración" });
    }
  }
);

// Eliminar configuración por ID
router_setting_ficha_sectorial.delete(
  "/settings-ficha-socioeconomica/:id",
  async (req, res) => {
    const { id } = req.params;
    try {
      const deletedSetting = await deleteSetting(id);
      if (!deletedSetting) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res
        .status(200)
        .json({ message: "Configuración eliminada correctamente" });
    } catch (error) {
      res.status(400).json({ error: "Error eliminando la configuración" });
    }
  }
);

export default router_setting_ficha_sectorial;
