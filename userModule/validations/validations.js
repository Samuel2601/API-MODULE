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
    .isLength({ min: 10, max: 10 }),
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
    return (typeof value === 'object');
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
      value.forEach(element => {
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

export function criterioFormat(modelo,criterios){
  const filtro = { ...criterios };

      // Preparar los parámetros de búsqueda para campos de fecha
      for (const [campo, valor] of Object.entries(criterios)) {
        if (esCampoCriterio(modelo, campo, "Date")) {
          if (
            valor &&
            typeof valor === "object" &&
            ("inicio" in valor || "fin" in valor)
          ) {
            const fechaInicio = valor.inicio
              ? new Date(valor.inicio)
              : new Date();
            const fechaFin = valor.fin ? new Date(valor.fin) : new Date();

            if (valor.inicio && valor.fin) {
              filtro[campo] = { $gte: fechaInicio, $lte: fechaFin };
            } else if (valor.inicio) {
              filtro[campo] = { $gte: fechaInicio };
            } else if (valor.fin) {
              filtro[campo] = { $lte: fechaFin };
            }
          } else if (valor && typeof valor === "string") {
            const fecha = new Date(valor);
            filtro[campo] = { $gte: fecha, $lte: new Date() };
          } else {
            delete filtro[campo];
          }
        }
      }
      return filtro;
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
    .custom((value, { req }) => {
      if (!value.hasOwnProperty("name")) {
        throw new Error("El campo 'name' es requerido en cada objeto.");
      }
      if (!value.hasOwnProperty("permisos")) {
        throw new Error("El campo 'permisos' es requerido en cada objeto.");
      }
      if (typeof value.name !== "string" || value.name.trim() === "") {
        throw new Error(
          "El campo 'name' debe ser una cadena de texto no vacía."
        );
      }
      if (!Array.isArray(value.permisos)) {
        throw new Error("El campo 'permisos' debe ser un array.");
      }
      if (!value.permisos.every((permiso) => typeof permiso === "string")) {
        throw new Error(
          "Cada elemento del campo 'permisos' debe ser una cadena de texto."
        );
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
  body(
    "name",
    "No puede ser vacio, debe contener solo caracteres alfabéticos..."
  )
    .trim()
    .notEmpty()
    .isAlpha(),
  body("user").isArray().withMessage("Permisos debe ser un array."),
];

export const putroleValidations = [
  body(
    "name",
    "No puede ser vacio, debe contener solo caracteres alfabéticos..."
  )
    .trim()
    .notEmpty()
    .isAlpha(),
  body("permisos").isArray().withMessage("Permisos debe ser un array."),
];

export const putuserValidations = [
  body("name", "El nombre debe contener solo letras y no puede estar vacío...")
    .trim()
    .isAlpha("es-ES", { ignore: " " })
    .notEmpty(),
  body(
    "last_name",
    "El apellido debe contener solo letras y no puede estar vacío..."
  )
    .isAlpha("es-ES", { ignore: " " })
    .trim()
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
    .isLength({ min: 10, max: 10 }),
  body("role", "Rol no puede estar vacío...").trim().notEmpty(),
];
