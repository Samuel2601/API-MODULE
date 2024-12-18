"use strict";

import express from "express";
import { getCiudadano } from "../../apiservices/sinardap.js";
import { updateRoutesOnDemand } from "../controllers/Recolectores_api.js";
import {
  auth,
  permissUser,
} from "../../middlewares/validationResultExpress.js";
import {
  deleteFile,
  generateBackupIfNotExists,
  listAppdata,
  shareFile,
} from "../../database/backup.js";
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
  auth,
  permissUser(`/backup`, "get"),
  async (req, res) => {
    const response = await generateBackupIfNotExists();
    res.status(response.status).json(response);
  }
);

router_extend.get(
  `/list_backup`,
  auth,
  permissUser(`/list_backup`, "get"),
  async (req, res) => {
    const response = await listAppdata();
    res.status(response.status).json(response);
  }
);

router_extend.get(
  "/share_backup/:fileId",
  auth,
  permissUser(`/share_backup/:fileid`, "get"),
  async (req, res) => {
    const { fileId } = req.params;

    if (!fileId) {
      return res
        .status(400)
        .json({ status: 400, message: "File ID is required" });
    }

    try {
      const response = await shareFile(fileId);
      res.status(response.status).json(response);
    } catch (error) {
      res
        .status(500)
        .json({ status: 500, message: "An error occurred", error });
    }
  }
);

router_extend.delete(
  "/deletefile_backup/:fileId",
  auth,
  permissUser(`/deletefile_backup/:fileid`, "get"),
  async (req, res) => {
    const { fileId } = req.params;

    if (!fileId) {
      return res
        .status(400)
        .json({ status: 400, message: "File ID is required" });
    }

    try {
      const response = await deleteFile(fileId);
      res.status(response.status).json(response);
    } catch (error) {
      res
        .status(500)
        .json({ status: 500, message: "An error occurred", error });
    }
  }
);

export default router_extend;
