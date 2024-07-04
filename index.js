"use strict";
import express from "express";
import "dotenv/config";

import { v4 as uuidv4 } from "uuid";
const secret = uuidv4();

// import
import "dotenv/config";
import connectDB from './database/connect.js';
// Conectar a la base de datos por defecto
connectDB();



import session from "express-session";

import userRoute from "./userModule/routes/user.route.js";
import roleRoute from "./userModule/routes/role.route.js";
import permisoRoute from "./userModule/routes/permiso.route.js";
import google from "./userModule/routes/google.route.js";
import facebook from "./userModule/routes/facebook.route.js";
import contact from "./userModule/routes/contac.route.js";
import webhoobs from "./userModule/contacModule/webhoobs/whatsapps.config.js";

import passport from "passport";
import * as passportSetupG from "./userModule/config/google.js";
import * as passportSetupF from "./userModule/config/facebook.js";

// swagger
import swaggerJSDoc from "swagger-jsdoc";
import * as swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "./swagger/configswagger.js";
import { permiso, roles, usuarios, autoguardarPermisos} from "./apiservices/traspaso.js";
import routerStand from "./labellaModule/routes/router.js";

roles();
usuarios();
//permiso();
const app = express();

// Configuración de sesión
app.use(session({ secret: secret, resave: true, saveUninitialized: true }));
// Configuración de Passport
app.use(passport.initialize());

app.use(express.json());
app.use("/api/v1", userRoute);
app.use("/api/v1", roleRoute);
app.use("/api/v1", permisoRoute);
app.use("/api",routerStand);
app.use("", google);
app.use("", facebook);
app.use("", contact);
app.use("", webhoobs);
autoguardarPermisos(app);
//config swagger
const specs = swaggerJSDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
