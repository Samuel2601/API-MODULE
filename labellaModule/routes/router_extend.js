"use strict";

import express from "express";
import { getCiudadano } from "../../apiservices/sinardap.js";
import { updateRoutesOnDemand } from "../controllers/Recolectores_api.js";
import {
  auth,
  permissUser,
} from "../../middlewares/validationResultExpress.js";
import { generateAndTransferBackup } from "../../database/backup.js";
const router_extend = express.Router();
router_extend.get("/getciudadano/:id", async (req, res) => {
  var id = req.params["id"];
  try {
    const ciudadano = await getCiudadano(id);
    res.status(200).json(ciudadano);
  } catch (error) {
    console.error("Error al obtener ciudadano:", error);
    res.status(500).json({ message: "Error al obtener ciudadano" });
  }
});
router_extend.get(
  `/recolector_ruta/:id`,
  auth,
  permissUser(`/recolector_ruta/:id`, "get"),
  async (req, res) => {
    const response = await updateRoutesOnDemand(req.params.id);
    res.status(response.status).json(response);
  }
);

router_extend.get(
  `/backup`,
  async (req, res) => {
    const response = await generateAndTransferBackup();
    res.status(response.status).json(response);
  }
);

export default router_extend;
