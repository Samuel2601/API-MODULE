// services.js
import {
  criterioFormat,
  getPopulateFields,
} from "../../userModule/validations/validations.js";
import { models } from "../models/Modelold.js";
//const models = require("../models/Model");

const SUCCESS_CODE = 200;
const ERROR_CODE = 500;
const NOFOUND_CODE = 500;
const PARTIAL_SUCCESS_CODE = 207;

// Response structure
const response = {
  status: null, // Can be 'SUCCESS_CODE' or 'ERROR_CODE'
  data: null, // Response data
  message: null, // Descriptive message (optional)
  error: null, // Error details (optional)
};
function cloneResponse() {
  return { ...response };
}

// List function
/*  userPopulateFields.length > 0
        ? userPopulateFields
        : Object.keys(modelSchema).filter(
            (field) =>
              modelSchema[field].options && modelSchema[field].options.ref
          );*/
//console.log(populateFields, filter);
//const modelSchema = models[model].schema.paths;
async function list(model, params, userPopulateFields = []) {
  let response = cloneResponse();
  try {
    const { populate, ...filterParams } = params;
    let aux = { ...filterParams };
    const filter = criterioFormat(models[model], aux);

    // Obtener los campos a populados
    const populateFields = getPopulateFields(models[model], userPopulateFields);

    // Crear la consulta con populate si es necesario
    let query = models[model].find(filter).sort({ createdAt: -1 });
    if (populateFields) {
      populateFields.forEach((field) => {
        query = query.populate(field);
      });
    }

    const data = await query;
    //console.log(data[0]);
    response.status = SUCCESS_CODE;
    response.data = data.length > 0 ? data : [];
    response.message = "Data retrieved successfully";
  } catch (error) {
    console.error(`Error listing documents for model ${model}:`, error);

    response.status = ERROR_CODE;
    response.message = "Error retrieving data";
    response.error = error.message;
  }
  return response;
}

// findById function
async function findById(model, id, userPopulateFields = []) {
  let response = cloneResponse();
  try {
    // Obtener los campos a populados
    const populateFields = getPopulateFields(models[model], userPopulateFields);

    // Crear la consulta con populate si es necesario
    let query = models[model].findById(id);
    
    if (populateFields) {
      populateFields.forEach((field) => {
        query = query.populate(field);
      });
    }

    const data = await query;
    if (!data) {
      response.status = NOFOUND_CODE;
      response.message = "Document not found";
    } else {
      response.status = SUCCESS_CODE;
      response.data = data;
      response.message = "Data retrieved successfully";
    }
  } catch (error) {
    console.error(`Error retrieving document for model ${model}:`, error);

    response.status = ERROR_CODE;
    response.message = "Error retrieving data";
    response.error = error.message;
  }
  return response;
}

// create function
async function create(model, data, files) {
  let response = cloneResponse();
  try {
    // Obtener el esquema del modelo para identificar campos de tipo array de String
    const modelSchema = models[model].schema.paths;

    // Identificar los campos que deben almacenar archivos
    const fileFields = Object.keys(modelSchema).filter(
      (field) =>
        modelSchema[field].instance === "Array" &&
        modelSchema[field].caster.instance === "String"
    );

    // Asignar los archivos a los campos correspondientes en el esquema
    if (files && Object.keys(files).length > 0) {
      fileFields.forEach((field) => {
        if (files[field]) {
          if (Array.isArray(files[field])) {
            data[field] = files[field].map((file) => file.path);
          } else {
            data[field] = files[field].path; // Si es un solo archivo
          }
        }
      });
    }

    const res = await models[model].create(data);

    response.status = SUCCESS_CODE;
    response.data = res;
    response.message = "Data created successfully";
  } catch (error) {
    console.error(`Error creating document for model ${model}:`, error);

    response.status = ERROR_CODE;
    response.message = "Error creating data";
    response.error = error.message;
  }
  return response;
}

// Update function
async function update(model, id, data, files) {
  let response = cloneResponse();
  try {
    // Obtener el esquema del modelo para identificar campos de tipo array de String
    const modelSchema = models[model].schema.paths;

    // Identificar los campos que deben almacenar archivos
    const fileFields = Object.keys(modelSchema).filter(
      (field) =>
        modelSchema[field].instance === "Array" &&
        modelSchema[field].caster.instance === "String"
    );

    // Asignar los archivos a los campos correspondientes en el esquema
    if (files && Object.keys(files).length > 0) {
      fileFields.forEach((field) => {
        if (files[field]) {
          if (Array.isArray(files[field])) {
            data[field] = files[field].map((file) => file.path);
          } else {
            data[field] = files[field].path; // Si es un solo archivo
          }
        }
      });
    }

    const res = await models[model].findByIdAndUpdate(id, data, { new: true });

    if (!res) {
      response.status = NOFOUND_CODE;
      response.message = "Document not found";
    } else {
      response.status = SUCCESS_CODE;
      response.data = res;
      response.message = "Data updated successfully";
    }
  } catch (error) {
    console.error(`Error updating document for model ${model}:`, error);

    response.status = ERROR_CODE;
    response.message = "Error updating data";
    response.error = error.message;
  }
  return response;
}

// Helper function to find schemas that reference the current schema
function findReferencingSchemas(modelName) {
  const referencingSchemas = [];
  for (const [schemaName, schemaModel] of Object.entries(models)) {
    const schemaPaths = schemaModel.schema.paths;
    for (const path in schemaPaths) {
      if (
        schemaPaths[path].options &&
        schemaPaths[path].options.ref === modelName
      ) {
        referencingSchemas.push({
          schemaName,
          path,
          required: schemaPaths[path].options.required || false,
        });
      }
    }
  }
  return referencingSchemas;
}

async function cascadingDelete(modelName, id) {
  const response = cloneResponse();
  try {
    // Delete the main document
    const mainDoc = await models[modelName].findByIdAndDelete(id);
    if (!mainDoc) {
      response.status = NOFOUND_CODE;
      response.message = "Document not found";
      return response;
    }

    // Object to store deleted documents information
    const deletedDocuments = {
      [modelName]: [{ id: mainDoc._id, schema: modelName }],
    };

    // Find and handle referencing schemas
    const referencingSchemas = findReferencingSchemas(modelName);
    for (const { schemaName, path, required } of referencingSchemas) {
      if (required) {
        // Recursively delete dependent documents if reference is required
        const deleted = await recursivelyDelete(schemaName, { [path]: id });
        if (deleted.length > 0) {
          deletedDocuments[schemaName] = deleted.map((doc) => ({
            id: doc._id,
            schema: schemaName,
          }));
        }
      } else {
        // Unset reference field if not required
        await models[schemaName].updateMany(
          { [path]: id },
          { $unset: { [path]: 1 } }
        );
      }
    }

    response.status = SUCCESS_CODE;
    response.data = deletedDocuments;
    response.message = "Data deleted successfully";
  } catch (error) {
    console.error(`Error deleting document for model ${modelName}:`, error);
    response.status = ERROR_CODE;
    response.message = "Error deleting data";
    response.error = error.message;
  }
  return response;
}

// Recursive function to delete documents and handle cascading deletes
async function recursivelyDelete(modelName, filter) {
  const deletedDocs = await models[modelName].find(filter);
  for (const doc of deletedDocs) {
    // Recursively delete documents in referenced schemas
    await cascadingDelete(modelName, doc._id);
  }
  return deletedDocs; // Return deleted documents
}

async function createBatch(model, dataArray, filesArray, abortOnError = true) {
  let response = cloneResponse();
  try {
    const modelSchema = models[model].schema.paths;
    const fileFields = Object.keys(modelSchema).filter(
      (field) =>
        modelSchema[field].instance === "Array" &&
        modelSchema[field].caster.instance === "String"
    );

    const documents = dataArray.map((data, index) => {
      const files = filesArray[index];

      if (files && Object.keys(files).length > 0) {
        fileFields.forEach((field) => {
          if (files[field]) {
            if (Array.isArray(files[field])) {
              data[field] = files[field].map((file) => file.path);
            } else {
              data[field] = files[field].path;
            }
          }
        });
      }

      return data;
    });

    const res = await models[model].insertMany(documents, {
      ordered: abortOnError,
    });

    response.status = SUCCESS_CODE;
    response.data = res;
    response.message = "Batch data created successfully";
  } catch (error) {
    console.error(`Error creating documents for model ${model}:`, error);

    if (abortOnError) {
      response.status = ERROR_CODE;
      response.message = "Error creating batch data";
      response.error = error.message;
    } else {
      response.status = PARTIAL_SUCCESS_CODE;
      response.data = error.insertedDocs || [];
      response.message = "Some documents failed to create";
      response.error = error.writeErrors || [];
    }
  }
  return response;
}

async function updateBatch(model, updates, abortOnError = true) {
  let response = cloneResponse();
  const errors = [];
  const updatedDocs = [];

  try {
    for (let i = 0; i < updates.length; i++) {
      const { id, data } = updates[i];

      try {
        const res = await models[model].findByIdAndUpdate(id, data, {
          new: true,
        });
        if (!res) {
          errors.push({ id, error: "Document not found" });
        } else {
          updatedDocs.push(res);
        }
      } catch (error) {
        errors.push({ id, error: error.message });
        if (abortOnError) {
          throw error;
        }
      }
    }

    if (errors.length === 0) {
      response.status = SUCCESS_CODE;
      response.data = updatedDocs;
      response.message = "Batch data updated successfully";
    } else {
      response.status = PARTIAL_SUCCESS_CODE;
      response.data = updatedDocs;
      response.message = "Some documents failed to update";
      response.error = errors;
    }
  } catch (error) {
    console.error(`Error updating documents for model ${model}:`, error);

    if (updatedDocs.length == 0) {
      response.status = ERROR_CODE;
      response.message = "Error updating batch data";
      response.error = error.message;
    } else {
      response.status = PARTIAL_SUCCESS_CODE;
      response.data = updatedDocs;
      response.message = "Some documents failed to update";
      response.error = errors;
    }
  }
  return response;
}

export {
  list,
  findById,
  create,
  update,
  cascadingDelete as remove,
  createBatch,
  updateBatch,
};
