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
 * /api/v1/obtenerRolesPorCriterio:
 *   post:
 *     summary: Listar Usuarios por Criterio.
 *     description: Lista los usuarios que coinciden con un criterio específico.
 *     tags: [ROLE]
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               campo:
 *                 type: string
 *                 description: Campo por el cual filtrar la búsqueda de usuarios.
 *                 example: name
 *               valor:
 *                 type: string
 *                 description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *                 example: Samuel
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
router.post(
  "/obtenerRolesPorCriterio",
  criterioValidations,
  validationResultExpress,
  auth,
  permissUser("obtenerRolesPorCriterio"),
  async (req, res) => {
    try {
      const { status, message, data, error } = await obtenerRolesPorCriterio(
        req.body
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
 * /api/v1/obtenerRole:
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
  "/obtenerRole",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("obtenerRole"),
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
 * /api/v1/registrarRolesMasivo:
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
  "/registrarRolesMasivo",
  roleValidator,
  validationResultExpress,
  permissUser("registrarRolesMasivo"),
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
 * /api/v1/eliminarRole:
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
  "/eliminarRole",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("eliminarRole"),
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
 * /api/v1/actualizarRole:
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
  "/actualizarRole",
  idValidations,
  putroleValidations,
  validationResultExpress,
  auth,
  permissUser("actualizarRole"),
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
