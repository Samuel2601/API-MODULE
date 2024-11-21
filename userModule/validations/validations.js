import { body, param, query } from "express-validator";
export const registrationValidations = [
  body("name", "El nombre debe contener solo letras y no puede estar vacío...")
    .trim()
    .isAlpha("es-ES", { ignore: " " })
    .notEmpty(),
  body(
    "last_name",
    "El apellido debe contener solo letras y no puede estar vacío..."
  )
    .trim()
    .isAlpha("es-ES", { ignore: " " })
    .notEmpty(),
  body("email", "Formato de correo electrónico incorrecto...")
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("password", "Formato de contraseña incorrecto...")
    .trim()
    .isLength({ min: 5 }),
  body("passwordConfirmation", "Las contraseñas no coinciden...").custom(
    (value, { req }) => {
      return value === req.body.password;
    }
  ),
  body(
    "telf",
    "El número de teléfono debe contener solo números y tener una longitud de 10 dígitos..."
  )
    .trim()
    .isNumeric()
    .isLength({ min: 10, max: 10 }),
  body(
    "dni",
    "El dni contener solo números y tener una longitud de 10 dígitos..."
  )
    .trim()
    .isNumeric()
    .isLength({ min: 10, max: 10 })
    .optional(),
];

export const loginValidations = [
  body("email", "Formato de correo electrónico incorrecto...")
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("password", "Formato de contraseña incorrecto...")
    .trim()
    .isLength({ min: 5 }),
];

export const WhatsAppValidations = [
  body("destinatario", "Formato de número incorrecto...").trim().notEmpty(),
  body(
    "customUid",
    "Formato de número de mensaje incorrecto. Debe ser msg-seguido de un número."
  )
    .matches(/^msg-\d+$/)
    .withMessage("El formato de customUid debe ser 'msg-NUMERO'."),
  body("mensaje", "Formato de mensaje incorrecto...").trim().notEmpty(),
];

const isJSON = (value) => {
  try {
    return typeof value === "object";
  } catch (error) {
    return false;
  }
};

export const WhatsAppOriginValidations = [
  body("destinatario", "Formato de número incorrecto...").trim().notEmpty(),
  body("mensaje", "Formato de mensaje incorrecto...").optional().trim(),
  body("template_name", "Formato de nombre de plantilla incorrecto...")
    .optional()
    .trim(),
  body("template_language", "Formato de lenguaje de plantilla incorrecto...")
    .optional()
    .trim(),
  body("template_values", "Formato de valores de plantilla incorrecto...")
    .optional()
    .isArray()
    .custom((value) => {
      value.forEach((element) => {
        if (!isJSON(element)) {
          throw new Error(
            "Los valores de la plantilla deben ser un objeto JSON válido."
          );
        }
      });
      return true;
    }),
];

export const validcodeValidations = [
  body("email", "Formato de correo electrónico incorrecto...")
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("codigo", "Formato de codigo incorrecto...")
    .trim()
    .isLength({ min: 4, max: 4 }),
];

export const criterioValidations = [
  body("campo", "Algo salio...").trim(),
  body("valor", "Algo salio..").trim(),
];

function esCampoCriterio(modelo, campo, criterio) {
  const schema = modelo.schema.paths;
  return schema[campo] && schema[campo].instance === criterio;
}
function isFieldType(model, field, type) {
  const schema = model.schema.paths;
  return schema[field] && schema[field].instance === type;
}
export function getPopulateFields(model, userPopulateFields) {
  const modelSchema = model.schema.paths;

  // Función para obtener campos con referencias (`ref`) en un conjunto de paths
  const getRefFields = (schemaPaths, parentField = "") =>
    Object.keys(schemaPaths)
      .filter((field) => {
        const fieldOptions = schemaPaths[field].options;
        return fieldOptions && fieldOptions.ref;
      })
      .map((field) => (parentField ? `${parentField}.${field}` : field));

  // Detectar campos referenciados en el nivel principal
  const topLevelPopulateFields = getRefFields(modelSchema);

  // Detectar campos referenciados en subdocumentos
  const subDocPopulateFields = Object.keys(modelSchema)
    .filter((field) => modelSchema[field].instance === "Embedded") // Filtra subdocumentos
    .flatMap((field) => {
      const subSchemaPaths = modelSchema[field].schema.paths;
      return getRefFields(subSchemaPaths, field);
    });

  // Combinar todos los campos de referencias encontrados
  const allPopulateFields = [
    ...topLevelPopulateFields,
    ...subDocPopulateFields,
  ];

  console.log("Todos los campos de referencia (populate):", allPopulateFields);

  // Si el usuario especifica "all", devolver todos los campos con referencia
  if (userPopulateFields.includes("all")) {
    return allPopulateFields;
  }

  // Validar que los campos enviados por el usuario existen en las referencias disponibles
  const validUserFields = userPopulateFields.filter((field) =>
    allPopulateFields.includes(field)
  );

  console.log("Campos solicitados válidos para populate:", validUserFields);

  return validUserFields;
}

export function criterioFormat(model, params) {
  const filter = { ...params };
  console.log(filter);
  // Preparar parámetros de búsqueda para campos de fecha
  for (const [field, value] of Object.entries(params)) {
    if (isFieldType(model, field, "Date")) {
      if (
        value &&
        typeof value === "object" &&
        ("start" in value || "end" in value)
      ) {
        const startDate = value.start ? new Date(value.start) : new Date();
        const endDate = value.end ? new Date(value.end) : new Date();

        if (value.start && value.end) {
          filter[field] = { $gte: startDate, $lte: endDate };
        } else if (value.start) {
          filter[field] = { $gte: startDate };
        } else if (value.end) {
          filter[field] = { $lte: endDate };
        }
      } else if (value && typeof value === "string") {
        const date = new Date(value);
        filter[field] = { $gte: date, $lte: new Date() };
      } else {
        delete filter[field];
      }
    }
  }
  return filter;
}

export const idValidations = [
  query("id", "El ID debe ser una cadena de texto no vacía.").trim().notEmpty(),
];

export const permisoValidator = [
  body().isArray().withMessage("El cuerpo debe ser un array."),
  body("*")
    .isObject()
    .withMessage("Cada elemento del array debe ser un objeto."),
  body("*")
    .bail()
    .custom((value, { req }) => {
      if (!value.hasOwnProperty("name")) {
        throw new Error("El campo 'name' es requerido en cada objeto.");
      }
      if (typeof value.name !== "string" || value.name.trim() === "") {
        throw new Error(
          "El campo 'name' debe ser una cadena de texto no vacía."
        );
      }
      if (value.hasOwnProperty("user")) {
        if (!Array.isArray(value.user)) {
          throw new Error("El campo 'user' debe ser un array.");
        }
        if (!value.user.every((userId) => typeof userId === "string")) {
          throw new Error(
            "Cada elemento del campo 'user' debe ser una cadena de texto."
          );
        }
      }
      return true;
    }),
];

export const roleValidator = [
  body().isArray().withMessage("El cuerpo debe ser un array."),
  body("*")
    .isObject()
    .withMessage("Cada elemento del array debe ser un objeto."),
  body("*")
    .bail()
    .custom((value) => {
      if (!value.hasOwnProperty("name")) {
        throw new Error("El campo 'name' es requerido en cada objeto.");
      }
      if (typeof value.name !== "string" || value.name.trim() === "") {
        throw new Error(
          "El campo 'name' debe ser una cadena de texto no vacía."
        );
      }

      // Validación opcional para permisos
      if (value.hasOwnProperty("permisos")) {
        if (!Array.isArray(value.permisos)) {
          throw new Error("El campo 'permisos' debe ser un array.");
        }
        if (!value.permisos.every((permiso) => typeof permiso === "string")) {
          throw new Error(
            "Cada elemento del campo 'permisos' debe ser una cadena de texto."
          );
        }
      }

      return true;
    }),
];

export const userArrayValidator = [
  body().isArray().withMessage("El cuerpo debe ser un array."),
  body("*")
    .isObject()
    .withMessage("Cada elemento del array debe ser un objeto."),
  body("*")
    .bail()
    .custom((value, { req }) => {
      const schema = {
        name: { type: "string", required: true },
        last_name: { type: "string", required: true },
        dni: { type: "string", required: true },
        telf: { type: "string", required: true },
        email: { type: "string", required: true },
        password: { type: "string", required: true },
        role: { type: "string", required: true },
      };
      const resp = validateAgainstSchema(value, schema);
      if (resp.length > 0) {
        throw new Error(`${resp.map((e) => e.message).join("; ")}`);
      }
      return true;
    }),
];

function validateAgainstSchema(data, schema) {
  const errors = [];
  for (const key in schema) {
    const { type, required, items } = schema[key];
    if (required && !data.hasOwnProperty(key)) {
      errors.push({ message: `El campo '${key}' es requerido.` });
    }
    if (data.hasOwnProperty(key)) {
      if (type === "array") {
        if (!Array.isArray(data[key])) {
          errors.push({ message: `El campo '${key}' debe ser un array.` });
        }
        if (items && !data[key].every((item) => typeof item === items.type)) {
          errors.push({
            message: `Cada elemento del campo '${key}' debe ser de tipo '${items.type}'.`,
          });
        }
      } else {
        if (typeof data[key] !== type) {
          errors.push({
            message: `El campo '${key}' debe ser de tipo '${type}'.`,
          });
        }
      }
    }
  }
  return errors;
}

export const putpermisoValidations = [
  body("name", "No puede ser vacío y debe ser una cadena de texto.")
    .trim()
    .notEmpty()
    .isString()
    .withMessage("El nombre debe ser una cadena de texto."),
  body("method", "El método no puede ser vacío.")
    .trim()
    .notEmpty()
    .isString()
    .withMessage("El método debe ser una cadena de texto."),
  body("user").isArray().withMessage("Permisos debe ser un array."),
  body("user.*").isMongoId().withMessage("Cada permiso debe ser un ID válido."),
];

export const putroleValidations = [
  body("name", "No puede ser vacío y debe ser una cadena de texto.")
    .trim()
    .notEmpty()
    .isString()
    .withMessage("El nombre debe ser una cadena de texto."),
  body("permisos").isArray().withMessage("Permisos debe ser un array."),
  body("permisos.*")
    .isMongoId()
    .withMessage("Cada permiso debe ser un ID válido."),
  body("orden")
    .isInt({ min: 1 })
    .withMessage("El orden debe ser un número entero positivo."),
];

export const putUserValidations = [
  body("name", "El nombre debe contener solo letras y no puede estar vacío...")
    .optional({ nullable: true }) // Permite que el campo sea opcional si no se envía
    .trim()
    .isAlpha("es-ES", { ignore: " " })
    .notEmpty(),
  body(
    "last_name",
    "El apellido debe contener solo letras y no puede estar vacío..."
  )
    .optional({ nullable: true }) // Permite que el campo sea opcional si no se envía
    .isAlpha("es-ES", { ignore: " " })
    .trim()
    .notEmpty(),
  body("email", "Formato de correo electrónico incorrecto...")
    .optional({ nullable: true }) // Permite que el campo sea opcional si no se envía
    .trim()
    .isEmail()
    .normalizeEmail(),
  body("password", "Formato de contraseña incorrecto...")
    .optional() // Permite que el campo sea opcional si no se envía
    .trim()
    .isLength({ min: 5 }),
  body("passwordConfirmation", "Las contraseñas no coinciden...")
    .optional({ nullable: true })
    .custom((value, { req }) => {
      return value === req.body.password;
    }),
  body(
    "telf",
    "El número de teléfono debe contener solo números y tener una longitud de 10 dígitos..."
  )
    .optional({ nullable: true }) // Permite que el campo sea opcional si no se envía
    .trim()
    .isNumeric()
    .isLength({ min: 10, max: 10 }),
  body(
    "dni",
    "El dni debe contener solo números y tener una longitud de 10 dígitos..."
  )
    .optional({ nullable: true }) // Permite que el campo sea opcional si no se envía
    .trim()
    .isNumeric()
    .isLength({ min: 10, max: 10 }),
  body("role", "El rol no puede estar vacío...").trim().notEmpty(),
];
