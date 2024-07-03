"use strict";

import { createToken } from "../../middlewares/validationResultExpress.js";
import { Model } from "../models/exporSchema.js";
import apiResponse from "../../helpers/sendstatus.js";
import * as bcrypt from "bcrypt-nodejs";
import { mail_confirmar_session } from "../contacModule/controllers/mail.controller.js";
import { criterioFormat } from "../validations/validations.js";

//FUNCTION USERSCHEMA
const register = async function (data, ret) {
  try {
    if (!data.role) {
      await createDefaultRoleAndPermission(data);
    }

    const existingUser = await findExistingUser(data);
    if (existingUser) {
      return apiResponse(
        409,
        "El correo y/o la cédula ya existe en la base de datos.",
        ret ? existingUser : null,
        null
      );
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    const newUser = await Model.User.create(data);
    return apiResponse(201, "Registrado con éxito.", newUser, null);
  } catch (error) {
    console.error(error);
    console.error(error);
    return apiResponse(500, "Algo salió mal.", null, error);
  }
};

async function createDefaultRoleAndPermission(data) {
  let permiso = await Model.Permiso.findOne().sort({ createdAt: -1 });
  if (!permiso) {
    permiso = await Model.Permiso.create({ name: "registrarPermisosMasivo" });
  }

  let role = await Model.Role.findOne().sort({ createdAt: -1 });
  if (!role) {
    role = await Model.Role.create({ name: "Admin", permisos: [permiso._id] });
  }
  data.role = role._id;
}

async function findExistingUser(data) {
  return await Model.User.findOne({
    $or: [
      { email: data.email },
      { dni: data.dni },
      { googleId: data.googleId },
      { facebookId: data.facebookId },
    ],
  });
}

async function hashPassword(password) {
  return await new Promise((resolve, reject) => {
    bcrypt.hash(password, null, null, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

const login = async function (data) {
  try {
    const admin_arr = await Model.User.findOne({ email: data.email });
    if (admin_arr) {
      if (admin_arr.status) {
        // Wrap bcrypt.compare() in a promise
        const checkPassword = new Promise((resolve, reject) => {
          bcrypt.compare(data.password, admin_arr.password, (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          });
        });

        // Wait for the promise to resolve
        const check = await checkPassword;

        if (check) {
          if(admin_arr.verificado){
            return apiResponse(
              200,
              (await mail_confirmar_session(data.email)) ||
                "El Código de un solo uso será enviado pronto", //"Bienvenido.",
              null, //createToken(admin_arr, data.time || null, data.tipo || null),
              null
            );
          }
         
        } else {
          return apiResponse(400, "Sin Coincidencia.", null, error);
        }
      } else {
        return apiResponse(401, "Credenciales Deshabilitadas.", null, null);
      }
    } else {
      return apiResponse(404, "No Registrado.", null, null);
    }
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};

const validarCodigo = async function (data) {
  try {
    console.log(data);
    const usuario = await Model.User.findOne({ email: data.email });
    console.log(usuario.verificationCode);
    if (usuario) {
      // Aquí puedes comparar el código de verificación recibido con el que tienes en la base de datos
      if (data.codigo === usuario.verificationCode) {
        //Correo de usuario verificado
        if (!usuario.verificado) {
          usuario.verificado = true;
        }
        usuario.verificationCode = null;
        await usuario.save();

        return apiResponse(
          200,
          "Bienvenido.",
          await createToken(usuario, data.time || null, data.tipo || null),
          null
        );
      } else {
        return apiResponse(
          400,
          "Código de verificación incorrecto.",
          null,
          null
        );
      }
    } else {
      return apiResponse(404, "Usuario no encontrado.", null, null);
    }
  } catch (error) {
    console.error(error);
    return apiResponse(
      500,
      "Error al validar el código de verificación.",
      null,
      error
    );
  }
};

const obtenerUser = async function (id) {
  try {
    const registro = await Model.User.findById(id);
    if (!registro) {
      return apiResponse(404, "Usuario no encontrado.", null, null);
    }
    return apiResponse(200, null, registro, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const obtenerUserPorCriterio = async function (criterios) {
  try {
    let registros = [];
    if (criterios) {
      const filtro = criterioFormat(Model.User, criterios);
      console.log(filtro);
      registros = await Model.User.find(filtro);
    } else {
      registros = await Model.User.find();
    }
    return apiResponse(200, null, registros, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const actualizarUser = async function (id, data) {
  try {
    if (data.password) {
      const hash = await new Promise((resolve, reject) => {
        bcrypt.hash(data.password, null, null, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }
    const registro = await Model.User.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!registro) {
      return apiResponse(404, "Registro no encontrado.", null, null);
    }
    return apiResponse(200, "Registro actualizado con éxito.", registro, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const eliminarUser = async function (id) {
  try {
    const registro = await Model.User.findByIdAndDelete(id);
    if (!registro) {
      return apiResponse(404, "Registro no encontrado.", null, null);
    }
    return apiResponse(200, "Registro eliminado con éxito.", null, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const registrarMasivoUser = async function (datos, update) {
  try {
    for (const element of datos) {
      const hash = await new Promise((resolve, reject) => {
        bcrypt.hash(element.password, null, null, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
      element.password = hash;
    }
    const usuarios = await Model.User.insertMany(datos, { ordered: false });
    return apiResponse(201, "Usuarios creados con éxito.", usuarios, null);
  } catch (error) {
    console.error(error);
    if (error.name === "MongoBulkWriteError" && update === "true") {
      const usuariosConErrores = error.result.result.writeErrors.map(
        (e) => datos[e.index]
      );
      const resp = await actualizarUsuarios(usuariosConErrores);
      if (resp.status === 200) {
        return apiResponse(
          200,
          "Usuarios creados y actualizados con éxito.",
          null,
          null
        );
      } else {
        return apiResponse(500, "ERROR", null, resp.error);
      }
    }
    return apiResponse(500, "ERROR", null, error);
  }
};
//AUXILIAR DE REGISTRO MASIVO
async function actualizarUsuarios(usuariosConErrores) {
  try {
    let usuariosActualizados = [];
    for (const usuario of usuariosConErrores) {
      const resultado = await Model.User.updateOne(
        { _id: usuario._id },
        usuario
      );
      usuariosActualizados.push(resultado);
    }
    if (usuariosActualizados.length === 0) {
      return apiResponse(
        404,
        "Ningún usuario encontrado para actualizar.",
        null,
        null
      );
    }
    return apiResponse(
      200,
      "Usuarios actualizados con éxito.",
      usuariosActualizados,
      null
    );
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
}

export {
  login,
  register,
  validarCodigo,
  obtenerUser,
  obtenerUserPorCriterio,
  actualizarUser,
  eliminarUser,
  registrarMasivoUser,
};
