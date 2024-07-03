import express from "express";

import {
  login,
  register,
  actualizarUser,
  eliminarUser,
  obtenerUser,
  obtenerUserPorCriterio,
  registrarMasivoUser,
  validarCodigo,
} from "../controllers/user.controller.js";
import {
  validationResultExpress,
  auth,
  permissUser,
} from "../../middlewares/validationResultExpress.js";
import {
  registrationValidations,
  loginValidations,
  criterioValidations,
  idValidations,
  userArrayValidator,
  putuserValidations,
  validcodeValidations,
} from "../validations/validations.js";

const router = express.Router();

/**
 * @swagger
 * /api/v1/register:
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
 * /api/v1/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Permite a un usuario iniciar sesión en el sistema.
 *     tags: [USER]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario.
 *                 example: saamare99@gmail.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario.
 *                 example: 123456789
 *     responses:
 *       '200':
 *         description: Inicio de sesión exitoso.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '500':
 *         description: Error interno en el servidor.
 */

router.post(
  "/login",
  loginValidations,
  validationResultExpress,
  async (req, res) => {
    try {
      const { status, message, data, error } = await login(req.body);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);
/**
 * @swagger
 * /api/v1/validcode:
 *   post:
 *     summary: Iniciar sesión
 *     description: Permite a un usuario iniciar sesión en el sistema.
 *     tags: [USER]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario.
 *                 example: saamare99@gmail.com
 *               codigo:
 *                 type: string
 *                 description: Código enviado al correo del usuario.
 *                 example: 1234
 *     responses:
 *       '200':
 *         description: Inicio de sesión exitoso.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '500':
 *         description: Error interno en el servidor.
 */
router.post(
  "/validcode",
  validcodeValidations,
  validationResultExpress,
  async (req, res) => {
    try {
      const { status, message, data, error } = await validarCodigo(req.body);
      res.status(status).json({ message, data, error });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "ERROR", error: error });
    }
  }
);

/**
 * @swagger
 * /api/v1/obtenerUserPorCriterio:
 *   post:
 *     summary: Listar Usuarios por Criterio.
 *     description: Lista los usuarios que coinciden con un criterio específico.
 *     tags: [USER]
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
  "/obtenerUserPorCriterio",
  criterioValidations,
  validationResultExpress,
  auth,
  permissUser("obtenerUserPorCriterio"),
  async (req, res) => {
    try {
      const { status, message, data, error } = await obtenerUserPorCriterio(
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
 * /api/v1/obtenerUser:
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
  "/obtenerUser",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("obtenerUser"),
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
 * /api/v1/registrarMasivoUser:
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
 * /api/v1/eliminarUser:
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
  "/eliminarUser",
  idValidations,
  validationResultExpress,
  auth,
  permissUser("eliminarUser"),
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
 * /api/v1/actualizarUser:
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
  "/actualizarUser",
  idValidations,
  putuserValidations,
  validationResultExpress,
  auth,
  permissUser("actualizarUser"),
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
