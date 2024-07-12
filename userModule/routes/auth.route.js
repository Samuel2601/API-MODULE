import express from "express";

import {
  login,
  obtenerUser,
  validarCodigo,
} from "../controllers/user.controller.js";

import {
  auth,
  createToken,
  idtokenUser,
  validationResultExpress,
} from "../../middlewares/validationResultExpress.js";

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
router.post("/recover-password", recoverPassword);
/**
 * @swagger
 * /refreshtoken:
 *   post:
 *     summary: Refresh token endpoint
 *     description: Refreshes user token based on provided ID.
 *     tags: [Auth]
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to refresh token for.
 *     responses:
 *       '200':
 *         description: Token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message.
 *                 token:
 *                   type: string
 *                   description: New JWT token.
 *                 error:
 *                   type: string
 *                   description: Error message, if any.
 *       '403':
 *         description: Invalid token or unauthorized access.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message.
 *                 error:
 *                   type: string
 *                   description: Internal error details.
 */
router.post("/refreshtoken", idtokenUser, async (req, res) => {
  try {
    const id = req.query["id"];
    const { status, message, data, error } = await obtenerUser(id);
    let token;
    if (data) {
      token = await createToken(data);
    }
    res.status(status).json({ message, token, error });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ERROR", error: error });
  }
});
export default router;
