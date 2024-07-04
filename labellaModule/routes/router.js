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

const routerStand = express.Router();

const generateRoutes = (modelName) => {
  const Model = models[modelName];
  const path = modelName.toLowerCase();

  //curl -X GET "http://tu-servidor.com/usuario?name=Samuel&createAt[start]=2024-07-04&createAt[end]=2024-07-06&rol=Administrador&populate=rol,otraRelacion"
  routerStand.get(`/${path}`, validateAuth(Model, "get"), async (req, res) => {
    const populateFields = req.query.populate
      ? req.query.populate.split(",")
      : [];
    const response = await list(modelName, req.query, populateFields);
    res.status(response.status).json(response);
  });

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

  routerStand.post(
    `/${path}`,
    validateAuth(Model, "post"),
    pathfile(path),
    async (req, res) => {
      const response = await create(modelName, req.body, req.files);
      res.status(response.status).json(response);
    }
  );

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

  routerStand.delete(
    `/${path}/:id`,
    validateAuth(Model, "delete"),
    async (req, res) => {
      const response = await remove(modelName, req.params.id);
      res.status(response.status).json(response);
    }
  );
  routerStand.post(
    `/createBatch/${path}`,
    validateAuth(Model, "createBatch"),
    pathfile(path),
    async (req, res) => {
      const abortOnError = req.query.abortOnError !== "false";
      const response = await createBatch(modelName, req.body, abortOnError);
      res.status(response.status).json(response);
    }
  );
  routerStand.put(
    `/updateBatch/${path}`,
    validateAuth(Model, "updateBatch"),
    pathfile(path),
    async (req, res) => {
      const abortOnError = req.query.abortOnError !== "false";
      const response = await updateBatch(modelName, req.body, abortOnError);
      res.status(response.status).json(response);
    }
  );
  return `
  components:
    schemas:
      ${modelName}:
        type: object
        properties:
          field:
            type: string
            description: Description of the field.
  
tags:
    - name: ${modelName}
      description: ${modelName} managing API
  
paths:
    /${path}}:
      get:
        summary: Retrieve a list of ${modelName}
        tags:
          - ${modelName}
        responses:
          '200':
            description: A list of ${modelName}
            content:
              application/json:
                schema:
                  type: array
                  items:
                    $ref: '#/components/schemas/${modelName}'
  
      post:
        summary: Create a new ${modelName}
        tags:
          - ${modelName}
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${modelName}'
        responses:
          '200':
            description: The ${modelName} was successfully created
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/${modelName}'
  
    /${path}/{id}:
      get:
        summary: Get a ${modelName} by ID
        tags:
          - ${modelName}
        parameters:
          - in: path
            name: id
            schema:
              type: string
            required: true
            description: The ${modelName} ID
        responses:
          '200':
            description: The ${modelName} description by ID
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/${modelName}'
          '404':
            description: The ${modelName} was not found
  
      put:
        summary: Update a ${modelName} by ID
        tags:
          - ${modelName}
        parameters:
          - in: path
            name: id
            schema:
              type: string
            required: true
            description: The ${modelName} ID
        requestBody:
          required: true
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/${modelName}'
        responses:
          '200':
            description: The ${modelName} was successfully updated
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/${modelName}'
  
      delete:
        summary: Delete a ${modelName} by ID
        tags:
          - ${modelName}
        parameters:
          - in: path
            name: id
            schema:
              type: string
            required: true
            description: The ${modelName} ID
        responses:
          '200':
            description: The ${modelName} was successfully deleted
            content:
              application/json:
                schema:
                  $ref: '#/components/schemas/${modelName}'
  `;
};
// Generar el contenido YAML para cada modelo

Object.keys(models).forEach((modelName) => {
  const swaggerContent = generateRoutes(modelName);
  const swaggerDir = path.join("./swaggerRoutes/labellaModule"); //path.join(__dirname, "swagger");
  if (!fs.existsSync(swaggerDir)) {
    fs.mkdirSync(swaggerDir);
  }
  const swaggerFilePath = path.join(
    swaggerDir,
    `${modelName.toLowerCase()}.yaml`
  );
  fs.writeFileSync(swaggerFilePath, swaggerContent.trim(), "utf8");
  console.log(
    `Swagger specs generated for ${modelName} and saved to ${swaggerFilePath}`
  );
});

export default routerStand;
