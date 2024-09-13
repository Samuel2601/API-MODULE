"use strict";
import { validationResult } from "express-validator";
import pkg from "jwt-simple";
import moment from "moment";
import { Model } from "../userModule/models/exporSchema.js";
import * as fs from "fs";
import path from "path";

var secret = "labella";

export const validationResultExpress = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const validateAuth = (model, method, path) => {
  return async (req, res, next) => {
    const isProtected = model.isProtected(method);

    if (isProtected) {
      // Primero autenticar al usuario
      await auth(req, res, async () => {
        // Después de autenticar, verificar permisos
        await permissUser(path, method)(req, res, next);
      });
    } else {
      // Si no está protegido, pasar al siguiente middleware
      next();
    }
  };
};

export const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(403).send({ message: "NoHeadersError" });
  }
  var token1 = req.headers.authorization.replace(/^Bearer\s/, ""); // Esto elimina 'Bearer ' al principio
  var token = token1.replace(/['"]+/g, "");
  var segment = token.split(".");
  if (segment.length != 3) {
    return res.status(403).send({ message: "InvalidToken" });
  } else {
    try {
      var payload = pkg.decode(token, secret);

      if (payload.exp <= moment().unix()) {
        return res.status(403).send({ message: "TokenExpirado" });
      }
      req.user = payload;
    } catch (error) {
      console.error(error);
      return res.status(403).send({ message: "InvalidToken" });
    }
  }
  next();
};
// Función centralizada para verificar permisos
const checkPermission = async (path, method, user, rol) => {
  let hasPermission = false;

  // Check permission based on user
  const userPermission = await Model.Permiso.findOne({
    name: path,
    user,
    method,
  });
  if (userPermission) {
    hasPermission = true;
  }

  // If user has permission, no need to check role permission
  if (hasPermission) {
    return true;
  }

  // Check permission based on role
  const rolePermission = await Model.Permiso.findOne({ name: path, method });
  if (rolePermission) {
    const role = await Model.Role.findOne({
      _id: rol,
      permisos: rolePermission._id,
    });
    if (role) {
      hasPermission = true;
    }
  }

  return hasPermission;
};

// Middleware para verificar permisos de usuario y rol
export const permissUser = (path, method) => async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "No tienes permisos para esto." });
  }

  const hasPermission = await checkPermission(
    path,
    method,
    req.user.sub,
    req.user.role
  );

  if (!hasPermission) {
    return res.status(404).json({ message: "Sin Permisos" });
  }

  next();
};

export const createToken = async function (user, time, tipo, externo) {
  const validTimeUnits = [
    "year",
    "years",
    "y",
    "month",
    "months",
    "M",
    "week",
    "weeks",
    "w",
    "day",
    "days",
    "d",
    "hour",
    "hours",
    "h",
    "minute",
    "minutes",
    "m",
    "second",
    "seconds",
    "s",
    "millisecond",
    "milliseconds",
    "ms",
  ];
  console.log("USUARIO:", user, "TIME:", time, "TIPO:", tipo);
  try {
    // Verifica que la unidad de tiempo sea válida
    if (tipo && !validTimeUnits.includes(tipo)) {
      throw new Error("Unidad de tiempo inválida");
    }

    // Establece valores predeterminados si no se proporcionan
    const tiempoValido = time || 3;
    const tipoValido = tipo || "hours";

    if (user.status && !externo) {
      var payload = {
        sub: user._id,
        name: user.name.toUpperCase(),
        last_name: user.last_name.toUpperCase(),
        photo: user.photo,
        email: user.email,
        role: user.role,
        iat: moment().unix(),
        exp: moment().add(tiempoValido, tipoValido).unix(),
      };

      if (user.dni) {
        payload.dni = user.dni;
      }

      console.log("Payload creado:", payload);

      return pkg.encode(payload, secret);
    } else if (externo) {
      var payload = {
        sub: user._id,
        name: user.name.toUpperCase(),
        dni: user.dni,
        phone: user.phone,
        iat: moment().unix(),
        exp: moment().add(tiempoValido, tipoValido).unix(),
      };

      console.log("Payload creado:", payload);

      return pkg.encode(payload, secret);
    } else {
      return { message: "Usuario deshabilitado" };
    }
  } catch (error) {
    console.error("Error crear TOKEN:", error);
    return { message: "ERROR interno del Servidor" };
  }
};

export const idtokenUser = async function (req, res, next) {
  try {
    const token = req.headers.authorization
      ?.replace(/^Bearer\s/, "")
      ?.replace(/['"]+/g, "");
    if (!token) {
      return res.status(403).send({ message: "TokenMissing" });
    }

    const payload = pkg.decode(token, secret); // Asegúrate de tener 'secret' definido correctamente
    const id = req.query["id"];

    if (payload.sub !== id) {
      return res.status(403).send({ message: "InvalidToken" });
    }
  } catch (error) {
    console.error(error);
    return res.status(403).send({ message: "InvalidToken" });
  }
  next();
};

export const obtenerImagen = async function (req, res) {
  const carpeta = req.params["carpeta"];
  const img = req.params["img"];

  const basePath = "./uploads";
  const imgPath = path.join(basePath, carpeta, img);
  const defaultImgPath = path.join(basePath, "default.jpg");

  if (!img) {
    res.status(200).sendFile(path.resolve(defaultImgPath));
  }

  // Validar que la carpeta y el archivo no contengan rutas maliciosas
  if (carpeta.includes("..") || img.includes("..")) {
    return res.status(400).send("Solicitud inválida");
  }

  fs.stat(imgPath, function (err) {
    if (!err) {
      res.status(200).sendFile(path.resolve(imgPath));
    } else {
      res.status(200).sendFile(path.resolve(defaultImgPath));
    }
  });
};
