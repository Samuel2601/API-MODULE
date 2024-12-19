"use strict";

import express from "express";
import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import http from "http";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import swaggerJSDoc from "swagger-jsdoc";
import * as swaggerUi from "swagger-ui-express";
import { Server } from "socket.io";

// Importar dependencias y módulos personalizados
import connectDB from "./database/connect.js";
import authRoute from "./userModule/routes/auth.route.js";
import userRoute from "./userModule/routes/user.route.js";
import roleRoute from "./userModule/routes/role.route.js";
import permisoRoute from "./userModule/routes/permiso.route.js";
import googleRoute from "./userModule/routes/google.route.js";
import facebookRoute from "./userModule/routes/facebook.route.js";
import contactRoute from "./userModule/routes/contac.route.js";
import webhoobs from "./userModule/contacModule/webhoobs/whatsapps.config.js";
import router from "./apiservices/dinardap.goc.ec/dinardap.route.js";

import { swaggerOptions } from "./swagger/configswagger.js";
import {
  permiso,
  roles,
  usuarios,
  autoguardarPermisos,
} from "./apiservices/traspaso.js";
import routerStand from "./labellaModule/routes/router.js";
import * as passportSetupG from "./userModule/config/google.js";
import * as passportSetupF from "./userModule/config/facebook.js";
import router_extend from "./labellaModule/routes/router_extend.js";
import { consultarCedula } from "./apiservices/dinardap.goc.ec/controllers/cedula.js";
import rute_ficha_socioeconomica from "./labellaModule/routes/dashboard/ficha-socioeconomica.js";
import router_setting_ficha_sectorial from "./FischaSocioeconomica/controllers/settings.controller.js";
import { generateBackupIfNotExists } from "./database/backup.js";

// Configuración inicial
const secret = uuidv4();
connectDB(); // Conectar a la base de datos por defecto.
const app = express(); // Inicializar la aplicación Express
const server = http.createServer(app); // Crear el servidor HTTP

export let userSockets = {}; // Define userSockets como un objeto vacío al inicio del archivo

// Inicializar Socket.IO después de crear el servidor
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/new/socket.io",
});

io.on("connection", (socket) => {
  console.log("a user connected:", socket.id);

  // Emitir un mensaje de bienvenida
  socket.emit("welcome", "Welcome to the server!");

  // Escuchar evento para asociar el socket con el ID de usuario
  socket.on("set-user-id", (userId) => {
    console.log(`User ${userId} connected with socket ${socket.id}`);
    userSockets[userId] = socket;
  });

  // Ejemplo de cómo enviar un evento a un usuario específico
  socket.on("notify-user", ({ userId, data }) => {
    const userSocket = userSockets[userId];
    if (userSocket) {
      userSocket.emit("notification", data); // Emitir evento al usuario específico
    } else {
      console.log(`User ${userId} not connected.`);
    }
  });

  // Manejar la desconexión del usuario
  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
  });
});

// Funciones de notificación
export const notifyPermissionChange = (userId, action, permiso) => {
  try {
    if (io) {
      const userSocket = userSockets[userId];
      if (userSocket) {
        userSocket.emit("permissions-updated", { action, permiso });
        console.log(
          "Se notifico a usuario",
          userId,
          "con dispositivo conectado en: ",
          userSockets[userId],
          "del cambio de permiso:",
          permiso,
          " para:",
          action
        );
      } else {
        console.log(`User ${userId} not connected.`);
      }
    }
  } catch (error) {
    console.error("Algo salio mal:", error);
  }
};

export const notifyRoleChange = (userId, action, roleId) => {
  try {
    if (io) {
      const userSocket = userSockets[userId];
      if (userSocket) {
        userSocket.emit("role-updated", { action, roleId });
        console.log(
          "Se notifico a ",
          userId,
          "con dispositivo conectado en: ",
          userSockets[userId],
          "del cambio de rol:",
          roleId,
          " para:",
          action
        );
      } else {
        console.log(`User ${userId} not connected.`);
      }
    }
  } catch (error) {
    console.error("Algo salio mal:", error);
  }
};

// Configuración de sesión
app.use(session({ secret: secret, resave: true, saveUninitialized: true }));

// Inicialización de Passport
app.use(passport.initialize());
app.use(passport.session()); // Esto es necesario para mantener la sesión de autenticación

// Configuración de body-parser
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
app.use(bodyParser.json({ limit: "200mb", extended: true }));

// Configuración de CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header("Allow", "GET, PUT, POST, DELETE, OPTIONS");
  next();
});

// Definir rutas de la aplicación
//roles();
//usuarios();
app.use("/new", routerStand);
app.use("/new", permisoRoute);
app.use("/new", userRoute);
app.use("/new", roleRoute);
app.use("/new", router_extend);
app.use("/dinardap", router);
autoguardarPermisos(app);
app.use("/new", authRoute);
app.use("/new", googleRoute);
app.use("/new", facebookRoute);
app.use("/new", contactRoute);
app.use("/new", webhoobs);
app.use("/new", rute_ficha_socioeconomica);
app.use("/new", router_setting_ficha_sectorial);

// Endpoint para verificar el estado de Socket.IO
app.get("/new/socket-status", (req, res) => {
  if (io) {
    res.status(200).send({
      message: "Socket.IO server is running",
      path: io.path(),
      connections: io.engine.clientsCount,
    });
  } else {
    res.status(500).send({
      message: "Socket.IO server is not initialized",
    });
  }
});

// Configuración de Swagger
const specs = swaggerJSDoc(swaggerOptions);
app.use("/new/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Iniciar el servidor
const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
console.log("Iniciando el proceso de backup");
await generateBackupIfNotExists();
console.log("Backup finalizado");
/*
consultarCedula(3789, "0803768530").then((response) => {
  // Convertir la respuesta en un formato más legible
  console.log("Respuesta:", JSON.stringify(response, null, 2));
});*/

/*consultarRuc(3800, "1390001556001").then((response) => {
  // Convertir la respuesta en un formato más legible
  console.log("Respuesta:", JSON.stringify(response, null, 2));
});*/
/*
consultarCedula3805(3805, "0803768530").then((response) => {
  // Convertir la respuesta en un formato más legible
  console.log("Respuesta:", JSON.stringify(response, null, 2));
});*/
