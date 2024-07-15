"use strict";

import { Model } from "../models/exporSchema.js";
import apiResponse from "../../helpers/sendstatus.js";
import { criterioFormat, getPopulateFields } from "../validations/validations.js";
import { notifyPermissionChange } from "../../index.js";

//FUNCTION ROLUSERSCHEMA
const obtenerRole = async function (id) {
  try {
    const role = await Model.Role.findById(id).populate("permisos");
    if (!role) {
      return apiResponse(404, "Rol no encontrado.", null, null);
    }
    return apiResponse(200, null, role, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const obtenerRolesPorCriterio = async function (
  params,
  userPopulateFields = []
) {
  try {
    const { populate, ...filterParams } = params;
    let aux = { ...filterParams };
    const filter = criterioFormat(Model.Role, aux);
    // Obtener los campos a populados
    const populateFields = getPopulateFields(Model.Role, userPopulateFields);
    // Crear la consulta con populate si es necesario
    let query = Model.Role.find(filter).sort({ createdAt: -1 });
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
const actualizarRole = async function (id, data) {
  try {
    // Obtener el rol actual antes de la actualización
    const rolActual = await Model.Role.findById(id).populate("permisos");
    if (!rolActual) {
      return apiResponse(404, "Rol no encontrado.", null, null);
    }

    const permisosActuales = rolActual.permisos.map((permiso) =>
      permiso._id.toString()
    );

    // Actualizar el rol
    const rolActualizado = await Model.Role.findByIdAndUpdate(id, data, {
      new: true,
    }).populate("permisos");

    if (!rolActualizado) {
      return apiResponse(404, "Rol no encontrado.", null, null);
    }

    const permisosActualizados = rolActualizado.permisos.map((permiso) =>
      permiso._id.toString()
    );

    // Determinar los cambios en los permisos
    const permisosRemovidos = permisosActuales.filter(
      (permisoId) => !permisosActualizados.includes(permisoId)
    );
    const permisosAgregados = permisosActualizados.filter(
      (permisoId) => !permisosActuales.includes(permisoId)
    );

    // Obtener los usuarios que tienen este rol
    const usuarios = await Model.User.find({ role: id });

    // Notificar a los usuarios afectados
    usuarios.forEach((usuario) => {
      permisosRemovidos.forEach((permisoId) => {
        notifyPermissionChange(usuario._id, "PERMISSION_REMOVED", permisoId);
      });
      permisosAgregados.forEach((permisoId) => {
        notifyPermissionChange(usuario._id, "PERMISSION_ADDED", permisoId);
      });
    });

    return apiResponse(200, "Rol actualizado con éxito.", rolActualizado, null);
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
