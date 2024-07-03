"use strict";
import { validationResult } from "express-validator";
import pkg from "jwt-simple";
import moment from "moment";
import { Model } from "../userModule/models/exporSchema.js";
var secret = "examplekey";

export const validationResultExpress = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
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

export const permissUser = (funcion) => async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "Algo salió mal." });
  }
  if (
    !(
      (await checkPermiss({ user: req.user.sub, funcion })) ||
      (await checkPermissRol({ rol: req.user.role, funcion }))
    )
  ) {
    return res.status(404).json({ message: "Sin Permisos" });
  }
  next();
};

const checkPermissRol = async function (data) {
  const { rol, funcion } = data;
  const permiso = await Model.Permiso.findOne({ name: funcion });
  if (!permiso) {
    return false; // Si no se encuentra el permiso, retorna false
  }

  const role = await Model.Role.findOne({
    _id: rol,
    permisos: permiso._id,
  });
  return !!role; // Devuelve true si se encontró el rol con el permiso, de lo contrario false
};

const checkPermiss = async function (data) {
  const { user, funcion } = data;
  const permiso = await Model.Permiso.findOne({ name: funcion, user: user });
  if (permiso) {
    return true;
  } else {
    return false;
  }
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

  var payload = {
    sub: user._id,
    email: user.email,
    role: user.role,
    iat: moment().unix(),
    exp: moment()
      .add(tiempoValido, tipoValido)
      .unix(),
  };

  if (user.dni) {
    payload.dni = user.dni;
  }

  console.log("Payload creado:", payload);

  return pkg.encode(payload, secret);
};
