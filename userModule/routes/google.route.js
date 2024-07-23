import express from "express";
import passport from "passport";
import {
  auth,
  createToken,
} from "../../middlewares/validationResultExpress.js";
const redirectUrl =
  process.env.NODE_ENV === "production"
    ? "https://geoapi.esmeraldas.gob.ec/auth/login"
    : "http://localhost:4200/auth/login";

import { OAuth2Client } from 'google-auth-library';
import { Model } from "../models/exporSchema.js";
import { register } from "../controllers/user.controller.js";

const client = new OAuth2Client(process.env.WEB_CLIENT_ID);

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
 *     summary: Iniciar autenticaci�n de Google
 *     tags: [GoogleAuth]
 *     responses:
 *       200:
 *         description: Redirecci�n a la p�gina de autenticaci�n de Google
 */

/**
 * @swagger
 * /auth/google/callback/:
 *   get:
 *     summary: Callback de autenticaci�n de Google
 *     tags: [GoogleAuth]
 *     responses:
 *       200:
 *         description: Autenticaci�n exitosa
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
 *         description: Token v�lido
 *       403:
 *         description: Token inv�lido
 */
/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Cerrar Sesi�n
 *     tags: [GoogleAuth]
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Token v�lido
 *       403:
 *         description: Token inv�lido
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
    createToken(req.user, 6, "days")
      .then((data) => {
        const token = data; // Asume que `data` contiene el token
        const redirectWithTokenUrl = `${redirectUrl}?token=${token}`;
        res.redirect(redirectWithTokenUrl);
      })
      .catch((error) => {
        res.status(500).json({ message: "Error creating token", error });
      });
  }
);


// Rutas de autenticación móvil
router.post('/auth/mobile/google', async (req, res) => {
  const { token, name, lastName, email, googleId, photo } = req.body;

  try {
    console.log("Datos que recibe:", req.body);  // Verificar qué datos recibe

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (payload.email !== email || payload.sub !== googleId) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const datauser = new Model.User({
      name,
      last_name: lastName,
      email,
      googleId,
      photo,
      verificado: true,
    });

    const { status, message, data, error } = await register(datauser, true);

    if (status === 409) {
      let existingUser = await Model.User.findOne({ email: datauser.email });

      if (existingUser && !existingUser.googleId) {
        existingUser.googleId = datauser.googleId;
        existingUser.verificado = true;
        await existingUser.save();
        const Stoken = await createToken(existingUser, 6, 'days');
        return res.json({ token:Stoken });
      }

      const Stoken = await createToken(existingUser, 6, 'days');
      return res.json({ token:Stoken });
    }

    const Stoken = await createToken(data, 6, 'days');
    res.json({ token:Stoken });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid Google token', error });
  }
});
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
    //res.redirect('/'); //Inside a callback� bulletproof!
  });
});

export default router;
