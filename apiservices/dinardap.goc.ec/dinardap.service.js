import { consultarCedula } from "./controllers/cedula.js";
import { consultarRuc } from "./controllers/ruc.js";
import { Cedula } from "./model/dinardap_register.js";

// Función que valida si el código del paquete es válido para RUC o Cédula
const validarCodigoPaquete = (codigoPaquete) => {
  const codigosRuc = ["3793", "3795", "3796", "3797", "3798", "3799", "3800"];
  const codigosCedula = [
    "3789",
    "3790",
    "3792",
    "3794",
    "3801",
    "3803",
    "3804",
    "3805",
  ];

  if (codigosRuc.includes(codigoPaquete)) {
    return "ruc";
  } else if (codigosCedula.includes(codigoPaquete)) {
    return "cedula";
  } else {
    return null; // Código no válido
  }
};

// Función intermedia que verifica la existencia de la cédula o RUC
export async function verificarYConsultar(
  identificacion,
  codigoPaquete,
  consultAll = false
) {
  try {
    // Verificar si el código de paquete es válido
    const tipoPaquete = validarCodigoPaquete(codigoPaquete);
    if (!tipoPaquete) {
      return {
        success: false,
        mensaje: "Código de paquete no válido",
        datos: null,
      };
    }

    // Verificar si ya existe la cédula o RUC en la base de datos
    const registroExistente = await Cedula.findOne({ identificacion });

    // Si el registro existe, verificar si ya tiene el paquete
    if (registroExistente) {
      const paqueteExistente = registroExistente.paquetes.find(
        (paquete) => paquete.codigoPaquete === codigoPaquete
      );

      // Si ya existe el paquete, retornamos la información almacenada
      if (paqueteExistente) {
        return {
          success: true,
          mensaje: `La información de la ${tipoPaquete} ya está registrada`,
          datos: consultAll ? registroExistente : paqueteExistente.datos,
        };
      }
    }

    // Proceder con la consulta si el paquete no está registrado
    let consultaResult;
    if (tipoPaquete === "ruc") {
      consultaResult = await consultarRuc(codigoPaquete, identificacion);
    } else if (tipoPaquete === "cedula") {
      consultaResult = await consultarCedula(codigoPaquete, identificacion);
    }

    if (consultaResult.message) {
      return {
        success: false,
        mensaje: consultaResult.message,
        datos: consultAll ? registroExistente : null,
      };
    }

    // Almacenar la respuesta de la consulta en la base de datos
    const nuevoPaquete = {
      codigoPaquete,
      datos: consultaResult,
    };

    // Si la cédula o RUC no existe, crear un nuevo registro
    let registroUpdate;
    if (!registroExistente) {
      const nuevoRegistro = new Cedula({
        identificacion,
        paquetes: [nuevoPaquete],
      });

      registroUpdate = await nuevoRegistro.save();
    } else {
      // Si la cédula o RUC ya existe, agregamos el nuevo paquete
      registroExistente.paquetes.push(nuevoPaquete);
      registroUpdate = await registroExistente.save();
    }

    return {
      success: true,
      mensaje: "Consulta realizada con éxito",
      datos: consultAll ? registroUpdate : consultaResult,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      mensaje: "Ocurrió un error inesperado",
      datos: null,
    };
  }
}
