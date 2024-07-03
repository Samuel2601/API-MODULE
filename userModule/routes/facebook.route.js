import express from "express";
import passport from "passport";
import {
  auth,
  createToken,
} from "../../middlewares/validationResultExpress.js";
const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: FacebookAuth
 *   description: Facebook Authentication Endpoints
 */

/**
 * @swagger
 * /oauth2/redirect/facebook:
 *   get:
 *     summary: Iniciar autenticación de Facebook
 *     tags: [FacebookAuth]
 *     responses:
 *       200:
 *         description: Redirección a la página de autenticación de Facebook
 */

/**
 * @swagger
 * /auth/facebook/callback/:
 *   get:
 *     summary: Callback de autenticación de Facebook
 *     tags: [FacebookAuth]
 *     responses:
 *       200:
 *         description: Autenticación exitosa
 */
router.get('/oauth2/redirect/facebook',
  passport.authenticate('facebook', { failureRedirect: '/login', failureMessage: true }),
  function(req, res) {
    res.redirect('/');
  });

// callback url upon successful facebook authentication
router.get(
  "/auth/facebook/callback/",
  passport.authenticate("facebook", { session: false }),
  (req, res) => {
    createToken(req.user).then((data) => {
      console.log(data);
      res.status(200).json({ message: "Bienvenido.", data });
    });
  }
);

export default router;
