import express from "express";
import passport from "passport";
import {
  auth,
  createToken,
} from "../../middlewares/validationResultExpress.js";
const redirectUrl = process.env.NODE_ENV === 'production'
  ? 'https://geoapi.esmeraldas.gob.ec/auth/login'
  : 'http://localhost:4200';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: GoogleAuth
 *   description: Google Authentication Endpoints
 */

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Iniciar autenticación de Google
 *     tags: [GoogleAuth]
 *     responses:
 *       200:
 *         description: Redirección a la página de autenticación de Google
 */

/**
 * @swagger
 * /auth/google/callback/:
 *   get:
 *     summary: Callback de autenticación de Google
 *     tags: [GoogleAuth]
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 */

/**
 * @swagger
 * /verify:
 *   get:
 *     summary: Verificar token
 *     tags: [GoogleAuth]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Token válido
 *       403:
 *         description: Token inválido
 */
/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Cerrar Sesión
 *     tags: [GoogleAuth]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Token válido
 *       403:
 *         description: Token inválido
 */
router.get(
  "/auth/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
    accessType: "offline",
    approvalPrompt: "force",
  })
);

// callback url upon successful google authentication
router.get(
  "/auth/google/callback/",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    createToken(req.user, req.time, req.tipo).then((data) => {
      const token = data.token; // Asume que `data` contiene el token
      const redirectWithTokenUrl  = `${redirectUrl}?token=${token}`;
      res.redirect(redirectWithTokenUrl );
    }).catch(error => {
      res.status(500).json({ message: "Error creating token", error });
    });
  }
);

// route to check token with postman.
// using middleware to check for authorization header
router.get("/verify", auth, (req, res) => {
  if (null === req.user) {
    res.sendStatus(403);
  } else {
    res.json(req.user);
  }
});
// callback url upon successful google authentication
router.get("/logout", auth, (req, res) => {
  console.log("ABIERTO:", req.user);
  req.session.destroy(function (err) {
    res.status(200).json({ message: "Cerrado" });
    //res.redirect('/'); //Inside a callback… bulletproof!
  });
});

export default router;
