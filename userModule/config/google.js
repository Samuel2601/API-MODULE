import passport from "passport";
import { OAuth2Strategy as GoogleStrategy } from "passport-google-oauth";
import { Model } from "../models/exporSchema.js";
import { register } from "../controllers/user.controller.js";

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
      clientID: process.env.WEB_CLIENT_ID, //keys.web.client_id,
      clientSecret: process.env.WEB_CLIENT_SECRET, //keys.web.client_secret,
      callbackURL: process.env.WEB_REDIRECT_URIS.split(",")[0], //'http://localhost:4201/auth/google/callback/'//keys.web.redirect_uris[0]
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile);
      const email = profile.emails[0].value;
      const datauser = new Model.User();

      datauser.name = profile.name.givenName;
      datauser.last_name = profile.name.familyName;
      datauser.email = profile.emails[0].value;
      datauser.googleId = profile.id;
      datauser.photo = profile.photos[0].value;
      const { status, message, data, error } = await register(datauser, true);
      if (status === 409) {
        let existingUser = await Model.User.findOne({ email: datauser.email });

        if (existingUser && !existingUser.googleId) {
          existingUser.googleId = datauser.googleId;
          await existingUser.save();
          return done(null, existingUser);
        }

        return done(null, existingUser);
      }
      return done(null, data);
    }
  )
);
