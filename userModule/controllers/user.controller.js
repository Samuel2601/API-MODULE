"use strict";

import { createToken } from "../../middlewares/validationResultExpress.js";
import { Model } from "../models/exporSchema.js";
import apiResponse from "../../helpers/sendstatus.js";
import * as bcrypt from "bcrypt-nodejs";
import { mail_confirmar_session } from "../contacModule/controllers/mail.controller.js";
import {
  criterioFormat,
  getPopulateFields,
} from "../validations/validations.js";
import { notifyRoleChange } from "../../index.js";
import { models } from "../../labellaModule/models/Modelold.js";
import path from "path";
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
    return apiResponse(500, "Algo salió mal.", null, error);
  }
};

async function createDefaultRoleAndPermission(data) {
  let permiso = await Model.Permiso.findOne().sort({ createdAt: -1 });
  if (!permiso) {
    permiso = await Model.Permiso.create({ name: "/registrarpermisosmasivo", method: 'post'});
  }

  let role = await Model.Role.findOne({ name: "Ciudadano" }).sort({
    createdAt: -1,
  });
  if (!role) {
    role = await Model.Role.create({ name: "Admin", permisos: [permiso._id] });
  }
  data.role = role._id;
}

async function findExistingUser(data) {
  // Inicializar una variable para almacenar el usuario encontrado
  let existingUser = null;

  // Verificar si el campo email tiene un valor y buscar un usuario por email
  if (data.email) {
    existingUser = await Model.User.findOne({ email: data.email });
    if (existingUser) return existingUser;
  }

  // Verificar si el campo googleId tiene un valor y buscar un usuario por googleId
  if (data.googleId) {
    existingUser = await Model.User.findOne({ googleId: data.googleId });
    if (existingUser) return existingUser;
  }

  // Verificar si el campo facebookId tiene un valor y buscar un usuario por facebookId
  if (data.facebookId) {
    existingUser = await Model.User.findOne({ facebookId: data.facebookId });
    if (existingUser) return existingUser;
  }

  // Retornar null si no se encuentra ningún usuario
  return null;
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
    const user = await Model.User.findOne({ email: data.email });
    if (user) {
      if (user.status) {
        let passwordMatch = false;
        let passwordChange = false;
        // Primero verifica la contraseña temporal si existe
        if (user.password_temp) {
          passwordMatch = await new Promise((resolve, reject) => {
            bcrypt.compare(
              data.password,
              user.password_temp,
              (error, result) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(result);
                }
              }
            );
          });

          if (passwordMatch) {
            // Si la contraseña temporal coincide, elimínala y actualiza el usuario
            user.password_temp = null;
            passwordChange = true;
            await user.save();
          }
        }

        // Si no hay contraseña temporal o no coincide, verifica la contraseña normal
        if (!passwordMatch) {
          passwordMatch = await new Promise((resolve, reject) => {
            bcrypt.compare(data.password, user.password, (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            });
          });
        }

        if (passwordMatch) {
          if (user.verificado) {
            return apiResponse(
              200,
              (await mail_confirmar_session(data.email)) ||
                "El Código de un solo uso será enviado pronto",
              null,
              null
            );
          } else {
            const token = await createToken(
              user,
              data.time || null,
              data.tipo || null
            );
            return apiResponse(
              200,
              "Bienvenido.",
              { token, passwordChange },
              null
            );
          }
        } else {
          return apiResponse(400, "Sin Coincidencia.", null, null);
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
        const token = await createToken(
          usuario,
          data.time || null,
          data.tipo || null
        );
        return apiResponse(200, "Bienvenido.", { token }, null);
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
    const registro = await Model.User.findById(id).populate("role");
    if (!registro) {
      return apiResponse(404, "Usuario no encontrado.", null, null);
    }
    return apiResponse(200, null, registro, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const obtenerUserPorCriterio = async function (
  params,
  userPopulateFields = []
) {
  try {
    const { populate, ...filterParams } = params;
    let aux = { ...filterParams };
    const filter = criterioFormat(Model.User, aux);
    // Obtener los campos a populados
    const populateFields = getPopulateFields(Model.User, userPopulateFields);
    // Crear la consulta con populate si es necesario
    let query = Model.User.find(filter).sort({ createdAt: -1 });
    populateFields.forEach((field) => {
      query = query.populate(field);
    });
    const data = await query;
    return apiResponse(200, null, data.length > 0 ? data : [], null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const actualizarUser = async function (id, data, file) {
  console.log("DATOS QUE RECIBO DE PARA LA actuaizacion:", id, data);
  try {
    let roleChanged = false;
    let oldRole = null;

    // Obtener el usuario actual antes de la actualización
    const user = await Model.User.findById(id).populate("role");
    if (!user) {
      return apiResponse(404, "Usuario no encontrado.", null, null);
    }

    // Verificar si el rol ha cambiado
    if (data.role && user.role._id.toString() !== data.role) {
      roleChanged = true;
      oldRole = user.role._id.toString();
    }
    console.log("ARCHIVOS ENVIADOS: ", file);
    if (file && file["photo"] && file["photo"].path) {
      data.photo = path.basename(file["photo"].path);
    }

    // Hash de la nueva contraseña si se proporciona
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
      data.password = hash;
    }

    // Actualizar el usuario
    const registro = await Model.User.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("role");
    if (!registro) {
      return apiResponse(404, "Registro no encontrado.", null, null);
    }

    // Si el rol ha cambiado, notificar al usuario
    if (roleChanged) {
      // Notificar que el usuario ha sido eliminado del rol anterior
      if (oldRole) {
        notifyRoleChange(id, "ROLE_REMOVED", oldRole);
      }
      // Notificar que el usuario ha sido agregado al nuevo rol
      notifyRoleChange(id, "ROLE_ADDED", registro.role._id.toString());
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

const findExistingExterno = async function (data) {
  console.log(data);
  // Inicializar una variable para almacenar el usuario encontrado
  let existingUser = null;

  // Verificar si el campo email tiene un valor y buscar un usuario por email
  if (data.email) {
    existingUser = await models.Externo.findOne({ dni: data.email });
    if (existingUser) return existingUser;
  }

  // Retornar null si no se encuentra ningún usuario
  return null;
};

export {
  login,
  register,
  validarCodigo,
  obtenerUser,
  obtenerUserPorCriterio,
  actualizarUser,
  eliminarUser,
  registrarMasivoUser,
  findExistingUser,
  findExistingExterno,
};
