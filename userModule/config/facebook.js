import passport from "passport";
import FacebookStrategy from "passport-facebook";
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
  new FacebookStrategy.Strategy(
    {
      clientID: process.env.WEBFB_CLIENT_ID, //'362526216239241',//process.env.WEB_CLIENT_ID,//keys.web.client_id,
      clientSecret: process.env.WEBFB_CLIENT_SECRET, //'f2a155f45aea610c8a8e5e2e79bb5669',//process.env.WEB_CLIENT_SECRET,//keys.web.client_secret,
      callbackURL: process.env.WEB_REDIRECT_URIS.split(",")[1], //'http://localhost:4201/auth/google/callback/'//keys.web.redirect_uris[0]
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      //console.log(profile);
      console.log(process.env.WEB_REDIRECT_URIS.split(",")[1]);
      const email = profile.emails[0].value;
      const datauser = new Model.User();
      const { firstName, lastName } = extractName(profile.displayName);
      datauser.name = profile.name.givenName || firstName;
      datauser.last_name = profile.name.familyName || lastName;
      datauser.email = profile.emails[0].value;
      datauser.facebookId = profile.id;
      datauser.photo = profile.photos[0].value;
      const { status, message, data, error } = await register(datauser, true);
      if (status === 409) {
        let existingUser = await Model.User.findOne({ email: datauser.email });

        if (existingUser && !existingUser.facebookId) {
          existingUser.facebookId = datauser.facebookId;
          await existingUser.save();
          return done(null, existingUser);
        }

        return done(null, existingUser);
      }
      return done(null, data);
    }
  )
);

function extractName(displayName) {
  const names = displayName.split(" ");
  let firstName = "";
  let lastName = "";

  if (names.length === 2) {
    // Dos nombres, el primero es nombre y el segundo es apellido
    firstName = names[0];
    lastName = names[1];
  } else if (names.length === 3) {
    // Tres nombres, el primero es nombre y los dos siguientes son parte del apellido
    firstName = names[0];
    lastName = `${names[1]} ${names[2]}`;
  } else if (names.length >= 4) {
    // Cuatro o más nombres, los dos primeros son nombre y los dos siguientes son apellido
    firstName = `${names[0]} ${names[1]}`;
    lastName = `${names[2]} ${names[3]}`;
  }

  return { firstName, lastName };
}
