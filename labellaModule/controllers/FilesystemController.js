import fs from 'fs';
import { Ficha_sectorial, Incidentes_denuncia } from '../models/Model.js';

// Configura los paths y los modelos asociados
const paths = [
  {
    path: "./uploads/incidentes/",
    model: Incidentes_denuncia,
    field: ["foto", "evidencia"],
  },
  { path: "./uploads/fichas/", model: Ficha_sectorial, field: ["foto"] },
 // { path: "./uploads/avatar/", model: Usuario, field: ["foto"] },
];

async function listarArchivos() {
  let archivosporeliminar = [];
  try {
    let archivos = [];
    // Recorre los paths y agrega los archivos al listado
    for (const pathObj of paths) {
      const { path } = pathObj;
      try {
        const files = fs.readdirSync(path);
        archivos = archivos.concat(
          files.map((file) => ({
            path: path,
            fieldName: file,
            id: [],
          }))
        );
      } catch (err) {
        console.error(`Error al leer el directorio ${path}: ${err}`);
      }
    }

    for (let index = 0; index < archivos.length; index++) {
      let arch = archivos[index];
      for (let j = 0; j < paths.length; j++) {
        const pathObj = paths[j];

        if (arch.path == pathObj.path) {
          let query = [];
          pathObj.field.forEach((field) => {
            query.push({ [field]: arch.fieldName });
          });
          let findregister = await pathObj.model.findOne({ $or: query });
          if (findregister) {
            arch.id.push(findregister._id);
          }
        }
      }
    }
    archivosporeliminar = archivos.filter(element => element.id.length == 0);
  } catch (error) {
    console.error(error);
  }
  if (archivosporeliminar.length > 0) await eliminarArchivos(archivosporeliminar);
}
async function eliminarArchivos(archivos) {
  try {
    for (const archivo of archivos) {
      fs.unlinkSync(`${archivo.path}${archivo.fieldName}`);
      console.log(`Archivo ${archivo.fieldName} eliminado.`);
    }
  } catch (err) {
    console.error(`Error al eliminar archivos: ${err}`);
  }
}

export { listarArchivos };
