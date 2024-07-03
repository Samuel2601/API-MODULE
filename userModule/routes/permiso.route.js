import express from "express";

import {
  actualizarPermiso,
  eliminarPermiso,
  obtenerPermiso,
  obtenerPermisosPorCriterio,
  registrarPermisosMasivo,
} from "../controllers/permiso.controller.js";
import {
  validationResultExpress,
  auth,
  permissUser,
} from "../../middlewares/validationResultExpress.js";
import {
  criterioValidations,
  idValidations,
  permisoValidator,
  putpermisoValidations,
} from "../validations/validations.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/obtenerPermisosPorCriterio:
 *   post:
 *     summary: Listar Permisos por Criterio.
 *     description: Lista los usuarios que coinciden con un criterio específico.
 *     tags: [PERMISO]
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
  "/obtenerPermisosPorCriterio",
  //criterioValidations,
  //validationResultExpress,
  auth,
  permissUser("obtenerPermisosPorCriterio"),
  async (req, res) => {
    try {      
      const { status, message, data, error } = await obtenerPermisosPorCriterio(
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
 * /api/v1/obtenerPermiso:
 *   get:
 *     summary: Obtener permiso por ID
 *     description: Obtiene un permiso por su ID.
 *     tags: [PERMISO]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del permiso a obtener.
 *     responses:
 *       '200':
 *         description: Permiso encontrado.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '401':
 *         description: No autorizado.
 *       '404':
 *         description: Permiso no encontrado.
 *       '500':
 *         description: Error interno en el servidor.
 */
router.get(
  "/obtenerPermiso",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("obtenerPermiso"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await obtenerPermiso(id);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /api/v1/registrarPermisosMasivo:
 *   post:
 *     summary: Registrar permisos masivamente
 *     description: Registra varios permisos en la base de datos.
 *     tags: [PERMISO]
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
 *                   description: Nombre del permiso.
 *                   example: obtenerUser
 *                 user:
 *                   type: array
 *                   description: Array de IDs de usuarios asociados al permiso (opcional).
 *                   items:
 *                     type: string
 *                   example: ["662bb8b97d6c80f5daf3e973"]
 *     responses:
 *       '200':
 *         description: Permisos creados y actualizados con éxito.
 *       '201':
 *         description: Permisos creados con éxito.
 *       '500':
 *         description: Error interno del servidor.
 */

router.post(
  "/registrarPermisosMasivo",
  permisoValidator,
  validationResultExpress,
  auth,
  permissUser("registrarPermisosMasivo"),
  async (req, res) => {
    try {
      const { status, message, data, error } = await registrarPermisosMasivo(
        req.body,
        req.query.update
      );
      res.status(status).json({ message, data, error });
    } catch (error) {
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /api/v1/eliminarPermiso:
 *   delete:
 *     summary: Eliminar permiso por ID
 *     description: Eliminar un permiso por su ID.
 *     tags: [PERMISO]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del permiso a eliminar.
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
  "/eliminarPermiso",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("eliminarPermiso"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await eliminarPermiso(id);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /api/v1/actualizarPermiso:
 *   put:
 *     summary: Actualización de usuario
 *     description: Actualización un usuario en el sistema.
 *     tags: [PERMISO]
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
 *             $ref: '#/components/schemas/PutPermiso'
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
 *      PutPermiso:
 *        type: object
 *        required:
 *          - name
 *        properties:
 *          name:
 *            type: string
 *            description: Nombre del rol.
 *            example: actualizarPermiso
 *          user:
 *            type: array
 *            description: Array de IDs de permisos asociados al rol (opcional).
 *            items:
 *              type: string
 *            example: []
 */
router.put(
  "/actualizarPermiso",
  idValidations,
  putpermisoValidations,
  validationResultExpress,
  auth,
  permissUser("actualizarPermiso"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await actualizarPermiso(
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
