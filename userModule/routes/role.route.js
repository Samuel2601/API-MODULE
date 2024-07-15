import express from "express";

import {
  actualizarRole,
  eliminarRole,
  obtenerRole,
  obtenerRolesPorCriterio,
  registrarRolesMasivo,
} from "../controllers/role.controller.js";
import {
  validationResultExpress,
  auth,
  permissUser,
} from "../../middlewares/validationResultExpress.js";
import {
  criterioValidations,
  idValidations,
  putroleValidations,
  roleValidator,
} from "../validations/validations.js";

const router = express.Router();
/**
 * @swagger
 * /obtenerRolesPorCriterio:
 *   get:
 *     summary: Listar Roles por Criterio.
 *     description: Lista los roles que coinciden con un criterio específico.
 *     tags: [ROLE]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Campo por el cual filtrar la búsqueda de roles.
 *         example: Administrador
 *       - in: query
 *         name: orden
 *         schema:
 *           type: number
 *         description: Orden de los resultados.
 *         example: 1
 *       - in: query
 *         name: populate
 *         schema:
 *           type: string
 *         description: Campos a poblar en el resultado separados por comas.
 *         example: campo1,campo2
 *     responses:
 *       '200':
 *         description: Operación exitosa.
 *       '401':
 *         description: No autorizado.
 *       '403':
 *         description: Prohibido.
 *       '500':
 *         description: Error interno del servidor.
 */
router.get(
  "/obtenerrolesporcriterio",
  //criterioValidations,
  //validationResultExpress,
  auth,
  permissUser("/obtenerrolesporcriterio","get"),
  async (req, res) => {
    try {
      const populateFields = req.query.populate
          ? req.query.populate.split(",")
          : [];
      const { status, message, data, error } = await obtenerRolesPorCriterio(
        req.query, populateFields
      );
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /obtenerRole:
 *   get:
 *     summary: Obtener usuario por ID
 *     description: Obtiene un usuario por su ID.
 *     tags: [ROLE]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario a obtener.
 *     responses:
 *       '200':
 *         description: Usuario encontrado.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: Usuario no encontrado.
 *       '500':
 *         description: Error interno en el servidor.
 */
router.get(
  "/obtenerrole",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("/obtenerrole","get"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await obtenerRole(id);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /registrarRolesMasivo:
 *   post:
 *     summary: Registrar roles masivamente
 *     description: Registra varios roles en la base de datos.
 *     tags: [ROLE]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: update
 *         schema:
 *           type: boolean
 *         required: true
 *         description: Actualizar registros?.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Nombre del rol.
 *                   example: Admin
 *                 permisos:
 *                   type: array
 *                   description: Array de IDs de permisos asociados al rol (opcional).
 *                   items:
 *                     type: string
 *                   example: ["662bb8b97d6c80f5daf3e973"]
 *     responses:
 *       '200':
 *         description: Roles creados y actualizados con éxito.
 *       '201':
 *         description: Roles creados con éxito.
 *       '500':
 *         description: Error interno del servidor.
 */

router.post(
  "/registrarrolesmasivo",
  roleValidator,
  validationResultExpress,
  permissUser("/registrarrolesmasivo","post"),
  auth,
  async (req, res) => {
    try {
      const { status, message, data, error } = await registrarRolesMasivo(
        req.body,
        req.query.update
      );
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);

/**
 * @swagger
 * /eliminarRole:
 *   delete:
 *     summary: Eliminar rol por ID
 *     description: Eliminar un rol por su ID.
 *     tags: [ROLE]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del rol a eliminar.
 *     responses:
 *       '200':
 *         description: Usuario encontrado.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: Usuario no encontrado.
 *       '500':
 *         description: Error interno en el servidor.
 */
router.delete(
  "/eliminarrole",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("/eliminarrole","delete"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await eliminarRole(id);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /actualizarRole:
 *   put:
 *     summary: Actualización de usuario
 *     description: Actualización un usuario en el sistema.
 *     tags: [ROLE]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario a actualizar.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PutRole'
 *     responses:
 *       '201':
 *         description: Registro exitoso.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '409':
 *         description: El correo y/o la cédula ya existe en la base de datos.
 *       '500':
 *         description: Error interno en el servidor.
 * components:
 *    schemas:
 *      PutRole:
 *        type: object
 *        required:
 *          - name
 *        properties:
 *          name:
 *            type: string
 *            description: Nombre del rol.
 *            example: Admin
 *          permisos:
 *            type: array
 *            description: Array de IDs de permisos asociados al rol (opcional).
 *            items:
 *              type: string
 *            example: []
 */
router.put(
  "/actualizarrole",
  idValidations,
  putroleValidations,
  validationResultExpress,
  auth,
  permissUser("/actualizarrole","put"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await actualizarRole(
        id,
        req.body
      );
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);


export default router;
