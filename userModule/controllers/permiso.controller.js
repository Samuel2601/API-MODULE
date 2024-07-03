"use strict";

import { Model } from "../models/exporSchema.js";
import apiResponse from "../../helpers/sendstatus.js";
import { criterioFormat } from "../validations/validations.js";

//FUNCTION PERMISOSCHEMA
const obtenerPermiso = async function (id) {
  try {
    const permiso = await Model.Permiso.findById(id);
    if (!permiso) {
      return apiResponse(404, "Permiso no encontrado.", null, null);
    }
    return apiResponse(200, null, permiso, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};

const obtenerPermisosPorCriterio = async function (criterios) {
  try {
    let permisos = [];
    if (criterios) {
      const filtro = criterioFormat(Model.Permiso, criterios);
      console.log(filtro);
      permisos = await Model.Permiso.find(filtro);
    } else {
      permisos = await Model.Permiso.find();
    }
    return apiResponse(200, null, permisos, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const actualizarPermiso = async function (id, data) {
  try {
    const permiso = await Model.Permiso.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!permiso) {
      return apiResponse(404, "Permiso no encontrado.", null, null);
    }
    return apiResponse(200, "Permiso actualizado con éxito.", permiso, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const eliminarPermiso = async function (id) {
  try {
    const permiso = await Model.Permiso.findByIdAndDelete(id);
    if (!permiso) {
      return apiResponse(404, "Permiso no encontrado.", null, null);
    }
    return apiResponse(200, "Permiso eliminado con éxito.", null, null);
  } catch (error) {
    console.error(error);
    return apiResponse(500, "ERROR", null, error);
  }
};
const registrarPermisosMasivo = async function (datos, update) {
  try {
    const permisos = await Model.Permiso.insertMany(datos, { ordered: false });
    return apiResponse(201, "Permisos creados con éxito.", permisos, null);
  } catch (error) {
    console.error(error);
    if (error.name == "MongoBulkWriteError" && update === "true") {
      const documentosConErrores = error.result.result.writeErrors.map(
        (e) => datos[e.index]
      );
      // Llamar a una función para actualizar los registros con errores
      const resp = await actualizarPermisos(documentosConErrores);
      if (resp.status == 200) {
        return apiResponse(
          200,
          "Permisos creados y actualizados con éxito.",
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
async function actualizarPermisos(permisosConErrores) {
  try {
    // Iterar sobre los permisos con errores y actualizarlos
    let permisosActualizados = [];
    for (const permiso of permisosConErrores) {
      const resultado = await Model.Permiso.updateOne(
        { _id: permiso._id },
        permiso
      );
      permisosActualizados.push(resultado);
    }
    if (permisosActualizados.length === 0) {
      return apiResponse(
        404,
        "Ningún permiso encontrado para actualizar.",
        null,
        null
      );
    }
    return apiResponse(
      200,
      "Permisos actualizados con éxito.",
      permisosActualizados,
      null
    );
  } catch (error) {
    console.error(error);
    // Manejar el error, si es necesario
    return apiResponse(500, "ERROR", null, error);
  }
}

export {
  obtenerPermiso,
  obtenerPermisosPorCriterio,
  actualizarPermiso,
  eliminarPermiso,
  registrarPermisosMasivo,
};
