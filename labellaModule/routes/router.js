//import express from "express";
//import { list, findById, create } from "../controllers/funciones_standart";
//import models from "../models/Model";

import express from "express";

import { models } from "../models/Modelold.js";
import multiparty from "connect-multiparty";
import fs from "fs";
import path from "path";
import { auth } from "../../middlewares/validationResultExpress.js";
import {
  list,
  create,
  createBatch,
  findById,
  remove,
  update,
  updateBatch,
} from "../controllers/funciones_standart.js";

// Función para crear directorios si no existen
const createDirectoryIfNotExists = (directory) => {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

// Middleware de multiparty con directorio dinámico y creación de directorios
const pathfile = (modelName) => {
  const directory = path.join("./uploads", modelName.toLowerCase());
  createDirectoryIfNotExists(directory); // Asegura que el directorio exista
  return multiparty({
    uploadDir: directory,
    maxFieldsSize: 50 * 1024 * 1024,
  });
};

const validateAuth = (model, method) => {
  return (req, res, next) => {
    const isProtected = model.isProtected(method);
    if (isProtected) {
      return auth(req, res, next);
    }
    next();
  };
};

const routerStand = express.routerStand();

const generateRoutes = (modelName) => {
  const Model = models[modelName];
  const path = modelName.toLowerCase();

  /**
   * @swagger
   * components:
   *   schemas:
   *     ${path}:
   *       type: object
   *       properties:
   *         field:
   *           type: string
   *           description: Description of the field.
   */

  /**
   * @swagger
   * tags:
   *   name: ${path}
   *   description: ${path} managing API
   */

  /**
   * @swagger
   * /${path}:
   *   get:
   *     summary: Retrieve a list of ${path}
   *     tags: [${path}]
   *     responses:
   *       200:
   *         description: A list of ${path}
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/${path}'
   */
  //curl -X GET "http://tu-servidor.com/usuario?name=Samuel&createAt[start]=2024-07-04&createAt[end]=2024-07-06&rol=Administrador&populate=rol,otraRelacion"
  routerStand.get(`/${path}`, validateAuth(Model, "get"), async (req, res) => {
    const populateFields = req.query.populate
      ? req.query.populate.split(",")
      : [];
    const response = await list(modelName, req.query, populateFields);
    res.status(response.status).json(response);
  });

  /**
   * @swagger
   * /${path}/{id}:
   *   get:
   *     summary: Get a ${path} by ID
   *     tags: [${path}]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The ${path} ID
   *     responses:
   *       200:
   *         description: The ${path} description by ID
   *         contents:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/${path}'
   *       404:
   *         description: The ${path} was not found
   */
  //curl -X GET "http://tu-servidor.com/usuario/12345?populate=rol,otraRelacion"
  routerStand.get(
    `/${path}/:id`,
    validateAuth(Model, "get"),
    async (req, res) => {
      const populateFields = req.query.populate
        ? req.query.populate.split(",")
        : [];
      const response = await findById(modelName, req.params.id, populateFields);
      res.status(response.status).json(response);
    }
  );

  /**
   * @swagger
   * /${path}:
   *   post:
   *     summary: Create a new ${path}
   *     tags: [${path}]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/${path}'
   *     responses:
   *       200:
   *         description: The ${path} was successfully created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/${path}'
   *       500:
   *         description: Some server error
   */
  routerStand.post(
    `/${path}`,
    validateAuth(Model, "post"),
    pathfile(path),
    async (req, res) => {
      const response = await create(modelName, req.body, req.files);
      res.status(response.status).json(response);
    }
  );
  /**
   * @swagger
   * /${path}/{id}:
   *   put:
   *     summary: Update a ${path} by ID
   *     tags: [${path}]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The ${path} ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/${path}'
   *     responses:
   *       200:
   *         description: The ${path} was successfully updated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/${path}'
   *       500:
   *         description: Some server error
   */
  routerStand.put(
    `/${path}/:id`,
    validateAuth(Model, "put"),
    pathfile(path),
    async (req, res) => {
      const response = await update(
        modelName,
        req.params.id,
        req.body,
        req.files
      );
      res.status(response.status).json(response);
    }
  );
  /**
   * @swagger
   * /${path}/{id}:
   *   delete:
   *     summary: Delete a ${path} by ID
   *     tags: [${path}]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *         description: The ${path} ID
   *     responses:
   *       200:
   *         description: The ${path} was successfully deleted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/${path}'
   *       500:
   *         description: Some server error
   */
  routerStand.delete(
    `/${path}/:id`,
    validateAuth(Model, "delete"),
    async (req, res) => {
      const response = await remove(modelName, req.params.id);
      res.status(response.status).json(response);
    }
  );
  /**
   * @swagger
   * /createBatch/${path}:
   *   post:
   *     summary: Create multiple ${path} documents
   *     tags: [${path}]
   *     parameters:
   *       - in: query
   *         name: abortOnError
   *         schema:
   *           type: boolean
   *         description: Flag to abort batch creation on error (default true)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               $ref: '#/components/schemas/${path}'
   *     responses:
   *       200:
   *         description: Multiple ${path} documents created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/${path}'
   *                 message:
   *                   type: string
   *                   description: Success message
   *       500:
   *         description: Some server error
   */
  routerStand.post(
    `/createBatch/${path}`,
    validateAuth(Model, "createBatch"),
    pathfile(path),
    async (req, res) => {
      const abortOnError = req.query.abortOnError !== "false";

      const response = await createBatch(
        modelName,
        req.body,
        req.files,
        abortOnError
      );
      res.status(response.status).json(response);
    }
  );
  /**
   * @swagger
   * /updateBatch/${path}:
   *   put:
   *     summary: Update multiple ${path} documents
   *     tags: [${path}]
   *     parameters:
   *       - in: query
   *         name: abortOnError
   *         schema:
   *           type: boolean
   *         description: Flag to abort batch update on error (default true)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: array
   *             items:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                   description: The ID of the ${path} document to update
   *                 data:
   *                   $ref: '#/components/schemas/${path}'
   *     responses:
   *       200:
   *         description: Multiple ${path} documents updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: number
   *                   description: HTTP status code
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/${path}'
   *                 message:
   *                   type: string
   *                   description: Success message
   *       500:
   *         description: Some server error
   */
  routerStand.put(
    `/updateBatch/${path}`,
    validateAuth(Model, "updateBatch"),
    async (req, res) => {
      const abortOnError = req.query.abortOnError !== "false";

      const response = await updateBatch(modelName, req.body, abortOnError);
      res.status(response.status).json(response);
    }
  );
};

// Generar rutas para todos los modelos
Object.keys(models).forEach((modelName) => generateRoutes(modelName));

export default routerStand;
//module.exports = routerStand;
