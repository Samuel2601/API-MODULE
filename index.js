"use strict";
import express from "express";
import "dotenv/config";

import { v4 as uuidv4 } from "uuid";
const secret = uuidv4();

// import
import "dotenv/config";
import connectDB from './database/connect.js';
import bodyParser from "body-parser";
// Conectar a la base de datos por defecto
connectDB();



import session from "express-session";

import authRoute from "./userModule/routes/auth.route.js"
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
app.use("/new",routerStand);
app.use("/new", permisoRoute);
app.use("/new", userRoute);
app.use("/new", roleRoute);
autoguardarPermisos(app);

app.use("/new", authRoute);

app.use("/new", google);
app.use("/new", facebook);
app.use("/new", contact);
app.use("/new", webhoobs);

//config swagger
const specs = swaggerJSDoc(swaggerOptions);
app.use("/new/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
  console.log("Server running at http://localhost:" + PORT);
});
app.use(bodyParser.urlencoded({limit: '200mb',extended:true}));
app.use(bodyParser.json({limit: '200mb', extended: true}));

app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin','*'); 
    res.header('Access-Control-Allow-Headers','Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods','GET, PUT, POST, DELETE, OPTIONS');
    res.header('Allow','GET, PUT, POST, DELETE, OPTIONS');
    next();
});