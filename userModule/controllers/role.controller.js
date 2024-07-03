"use strict";

import { Model } from "../models/exporSchema.js";
import apiResponse from "../../helpers/sendstatus.js";
import { criterioFormat } from "../validations/validations.js";

//FUNCTION ROLUSERSCHEMA
const obtenerRole = async function (id) {
  try {
    const role = await Model.Role.findById(id);
    if (!role) {
      return apiResponse(404, "Rol no encontrado.", null, null);
    }
    return apiResponse(200, null, role, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const obtenerRolesPorCriterio = async function (criterios) {
  try {
    let roles = [];
    if (criterios) {
      const filtro = criterioFormat(Model.Role, criterios);
      console.log(filtro);
      roles = await Model.Role.find(filtro);
    } else {
      roles = await Model.Role.find();
    }
    return apiResponse(200, null, roles, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const actualizarRole = async function (id, data) {
  try {
    const role = await Model.Role.findByIdAndUpdate(id, data, { new: true });
    if (!role) {
      return apiResponse(404, "Rol no encontrado.", null, null);
    }
    return apiResponse(200, "Rol actualizado con éxito.", role, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const eliminarRole = async function (id) {
  try {
    const role = await Model.Role.findByIdAndDelete(id);
    if (!role) {
      return apiResponse(404, "Rol no encontrado.", null, null);
    }
    return apiResponse(200, "Rol eliminado con éxito.", null, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const registrarRolesMasivo = async function (datos, update) {
  try {
    const roles = await Model.Role.insertMany(datos, { ordered: false });
    return apiResponse(201, "Roles creados con éxito.", roles, null);
  } catch (error) {
    console.error(error);
    if (error.name === "MongoBulkWriteError" && update === "true") {
      const rolesConErrores = error.result.result.writeErrors.map(
        (e) => datos[e.index]
      );
      const resp = await actualizarRoles(rolesConErrores);
      if (resp.status === 200) {
        return apiResponse(
          200,
          "Roles creados y actualizados con éxito.",
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
async function actualizarRoles(rolesConErrores) {
  try {
    let rolesActualizados = [];
    for (const rol of rolesConErrores) {
      const resultado = await Model.Role.updateOne({ _id: rol._id }, rol);
      rolesActualizados.push(resultado);
    }
    if (rolesActualizados.length === 0) {
      return apiResponse(
        404,
        "Ningún rol encontrado para actualizar.",
        null,
        null
      );
    }
    return apiResponse(
      200,
      "Roles actualizados con éxito.",
      rolesActualizados,
      null
    );
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
}

export {
  obtenerRole,
  obtenerRolesPorCriterio,
  actualizarRole,
  eliminarRole,
  registrarRolesMasivo,
};
