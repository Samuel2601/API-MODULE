import express from "express";

import {
  register,
  actualizarUser,
  eliminarUser,
  obtenerUser,
  obtenerUserPorCriterio,
  registrarMasivoUser,
} from "../controllers/user.controller.js";
import {
  validationResultExpress,
  auth,
  permissUser,
} from "../../middlewares/validationResultExpress.js";
import {
  registrationValidations,
  idValidations,
  userArrayValidator,
  putUserValidations,
} from "../validations/validations.js";

const router = express.Router();

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Registro de usuario
 *     description: Registra un nuevo usuario en el sistema.
 *     tags: [USER]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
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
 *      User:
 *        type: object
 *        required:
 *          - name
 *          - last_name
 *          - email
 *          - password
 *          - passwordConfirmation
 *          - telf
 *          - dni
 *        properties:
 *          name:
 *            type: string
 *            description: Nombre del usuario.
 *            example: Samuel
 *          last_name:
 *            type: string
 *            description: Apellido del usuario.
 *            example: Arevalo
 *          email:
 *            type: string
 *            format: email
 *            description: Correo electrónico del usuario.
 *            example: saamare99@gmail.com
 *          password:
 *            type: string
 *            description: Contraseña del usuario.
 *            example: 123456789
 *          passwordConfirmation:
 *            type: string
 *            description: Confirmación de la contraseña del usuario.
 *            example: 123456789
 *          telf:
 *            type: string
 *            description: Número de teléfono del usuario.
 *            example: '0995767887'
 *          dni:
 *            type: string
 *            description: Número de teléfono del usuario.
 *            example: 1234567891
 */

router.post(
  "/register",
  registrationValidations,
  validationResultExpress,
  async (req, res) => {
    try {
      const { status, message, data, error } = await register(req.body);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /obtenerUserPorCriterio:
 *   get:
 *     summary: Listar Usuarios por Criterio.
 *     description: Lista los usuarios que coinciden con un criterio específico.
 *     tags: [USER]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *         example: Samuel
 *       - in: query
 *         name: last_name
 *         schema:
 *           type: string
 *         description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *         example: Arevalo
 *       - in: query
 *         name: dni
 *         schema:
 *           type: string
 *         description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *         example: dni
 *       - in: query
 *         name: telf
 *         schema:
 *           type: string
 *         description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *         example: telf
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *         example: email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Valor del campo por el cual filtrar la búsqueda de usuarios.
 *         example: status
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
  "/obteneruserporcriterio",
  auth,
  permissUser("/obteneruserporcriterio", "get"),
  async (req, res) => {
    try {
      const populateFields = req.query.populate
        ? req.query.populate.split(",")
        : [];
      const { status, message, data, error } = await obtenerUserPorCriterio(
        req.query,
        populateFields
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
 * /obtenerUser:
 *   get:
 *     summary: Obtener usuario por ID
 *     description: Obtiene un usuario por su ID.
 *     tags: [USER]
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
  "/obteneruser",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("/obteneruser", "get"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await obtenerUser(id);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);

/**
 * @swagger
 * /registrarMasivoUser:
 *   post:
 *     summary: Registrar usuarios masivamente
 *     description: Registra varios usuarios en la base de datos.
 *     tags: [USER]
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
 *               $ref: '#/components/schemas/UserMasivo'
 *           example:
 *             - name: Juan
 *               last_name: Pérez
 *               email: juan@example.com
 *               password: "123456"
 *               role: 662bb8b97d6c80f5daf3e973
 *               dni: "0995767887"
 *               telf: "0995767887"
 *             - name: María
 *               last_name: López
 *               email: maria@example.com
 *               password: "789012"
 *               role: 662bb8b97d6c80f5daf3e974
 *               dni: "0995767887"
 *               telf: "0995767887"
 *             - name: Pedro
 *               last_name: García
 *               email: pedro@example.com
 *               password: "345678"
 *               role: 662bb8b97d6c80f5daf3e975
 *               dni: "0995767887"
 *               telf: "0995767887"
 *     responses:
 *       '200':
 *         description: Usuarios creados y actualizados con éxito.
 *       '201':
 *         description: Usuarios creados con éxito.
 *       '500':
 *         description: Error interno del servidor.
 * components:
 *   schemas:
 *     UserMasivo:
 *       type: object
 *       required:
 *         - name
 *         - last_name
 *         - email
 *         - password
 *         - telf
 *         - dni
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del usuario.
 *           example: Samuel
 *         last_name:
 *           type: string
 *           description: Apellido del usuario.
 *           example: Arevalo
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario.
 *           example: saamare99@gmail.com
 *         password:
 *           type: string
 *           description: Contraseña del usuario.
 *           example: 123456789
 *         telf:
 *           type: string
 *           description: Número de teléfono del usuario.
 *           example: '0995767887'
 *         dni:
 *           type: string
 *           description: Número de documento de identidad del usuario.
 *           example: 1234567891
 *         role:
 *           type: string
 *           description: ID del rol asignado al usuario (opcional).
 *           example: 662bb8b97d6c80f5daf3e973
 */

router.post(
  "/registrarMasivoUser",
  userArrayValidator,
  validationResultExpress,
  auth,
  permissUser("/registrarMasivoUser", "post"),
  async (req, res) => {
    try {
      const { status, message, data, error } = await registrarMasivoUser(
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
 * /eliminarUser:
 *   delete:
 *     summary: Eliminar usuario por ID
 *     description: Eliminar un usuario por su ID.
 *     tags: [USER]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del usuario a eliminar.
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
  "/eliminaruser",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("/eliminaruser", "delete"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await eliminarUser(id);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);

/**
 * @swagger
 * /actualizarUser:
 *   put:
 *     summary: Actualización de usuario
 *     description: Actualización un usuario en el sistema.
 *     tags: [USER]
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
 *             $ref: '#/components/schemas/PutUser'
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
 *      PutUser:
 *        type: object
 *        required:
 *          - name
 *          - last_name
 *          - email
 *          - password
 *          - passwordConfirmation
 *          - telf
 *          - dni
 *          - role
 *        properties:
 *          name:
 *            type: string
 *            description: Nombre del usuario.
 *            example: Samuel
 *          last_name:
 *            type: string
 *            description: Apellido del usuario.
 *            example: Arevalo
 *          email:
 *            type: string
 *            format: email
 *            description: Correo electrónico del usuario.
 *            example: saamare99@gmail.com
 *          password:
 *            type: string
 *            description: Contraseña del usuario.
 *            example: 123456789
 *          passwordConfirmation:
 *            type: string
 *            description: Confirmación de la contraseña del usuario.
 *            example: 123456789
 *          telf:
 *            type: string
 *            description: Número de teléfono del usuario.
 *            example: '0995767887'
 *          dni:
 *            type: string
 *            description: Número de teléfono del usuario.
 *            example: 1234567891
 *          role:
 *           type: string
 *           description: ID del rol asignado al usuario (opcional).
 *           example: 662feebb0993e219e7db8bfa
 */
router.put(
  "/actualizaruser",
  idValidations,
  putUserValidations,
  validationResultExpress,
  auth,
  permissUser("/actualizaruser", "put"),
  async (req, res) => {
    try {
      const id = req.query["id"];
      const { status, message, data, error } = await actualizarUser(
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
