import express from "express";

import { login, validarCodigo } from "../controllers/user.controller.js";

import { validationResultExpress } from "../../middlewares/validationResultExpress.js";

import {
  loginValidations,
  validcodeValidations,
} from "../validations/validations.js";
import { recoverPassword } from "../contacModule/controllers/PasswordReset.js";

const router = express.Router();

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Permite a un usuario iniciar sesión en el sistema.
 *     tags: [Auth]
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
 * /validcode:
 *   post:
 *     summary: Iniciar sesión
 *     description: Permite a un usuario iniciar sesión en el sistema.
 *     tags: [Auth]
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
 * /recover-password:
 *   post:
 *     summary: Iniciar sesión
 *     description: Permite a un usuario recuperar acceso a su cuenta con una clave temporal de un unico acceso.
 *     tags: [Auth]
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
 *     responses:
 *       '200':
 *         description: Inicio de sesión exitoso.
 *       '400':
 *         description: Error en la solicitud debido a validaciones fallidas.
 *       '500':
 *         description: Error interno en el servidor.
 */
router.post('/recover-password', recoverPassword);

export default router;
