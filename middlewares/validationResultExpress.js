"use strict";
import { validationResult } from "express-validator";
import pkg from "jwt-simple";
import moment from "moment";
import { Model } from "../userModule/models/exporSchema.js";
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
    return res.status(403).json({ message: "Algo salió mal." });
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

/**
 * Crea un token JWT
 *
 * @param {Object} user - El usuario para el cual se crea el token
 * @param {Number} time - El tiempo de expiración del token
 * @param {String} tipo - La unidad de tiempo para la expiración del token
 * @returns {String} - El token JWT creado
 */
export const createToken = async function (user, time, tipo) {
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

  // Verifica que la unidad de tiempo sea válida
  if (tipo && !validTimeUnits.includes(tipo)) {
    throw new Error("Unidad de tiempo inválida");
  }

  // Establece valores predeterminados si no se proporcionan
  const tiempoValido = time || 3;
  const tipoValido = tipo || "hours";
  console.log(user);
  if(user.status){
    var payload = {
      sub: user._id,
      name: user.name.toUpperCase(),
      last_name: user.last_name.toUpperCase(),
      photo: user.photo,
      correo: user.email,
      role: user.role,
      iat: moment().unix(),
      exp: moment().add(tiempoValido, tipoValido).unix(),
    };
  
    if (user.dni) {
      payload.dni = user.dni;
    }
  
    console.log("Payload creado:", payload);
  
    return pkg.encode(payload, secret);
  }else{
    return {message:'Usuario deshabilitado'}
  }
 
};
