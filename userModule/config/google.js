import passport from "passport";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { Model } from "../models/exporSchema.js";
import { findExistingUser, register } from "../controllers/user.controller.js";

//require('dotenv').config();
// An import assertion in a dynamic import
/*const {default:keys} = await import("../cliente/clientegoogle.json", {
  assert: {
    type: "json",
  },
});*/

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.WEB_CLIENT_ID,
      clientSecret: process.env.WEB_CLIENT_SECRET,
      callbackURL: process.env.WEB_REDIRECT_URIS.split(",")[0],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        // Verificar si el usuario ya existe
        let existingUser = await findExistingUser({ email, googleId: profile.id });
        
        if (existingUser) {
          // Si existe pero no tiene googleId, actualizar el registro
          if (!existingUser.googleId) {
            existingUser.googleId = profile.id;
            existingUser.verificado = true;
            await existingUser.save();
          }
          return done(null, existingUser);
        }

        // Si no existe, registrar el nuevo usuario
        const datauser = new Model.User({
          name: profile.name.givenName,
          last_name: profile.name.familyName,
          email,
          googleId: profile.id,
          photo: profile.photos[0].value,
          verificado: true,
        });

        const { status, data } = await register(datauser, true);
        
        if (status === 409) {
          return done(null, false, { message: "User already exists" });
        }

        return done(null, data);
      } catch (error) {
        return done(error);
      }
    }
  )
);