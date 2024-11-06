// Función que realiza la consulta SOAP
import axios from "axios";
import xml2js from "xml2js";
//3793, 3795, 3796, 3797, 3798, 3799, 3800
// Lista de códigos válidos
const codigosValidos = ["3793", "3795", "3796", "3797", "3798", "3799", "3800"];

export async function consultarRuc(codigoPaquete, identificacion) {
  // Validar que el código esté en la lista de códigos válidos
  if (!codigosValidos.includes(codigoPaquete)) {
    return { message: "El código de paquete no es válido" };
  }

  // Validar que la identificación no tenga más de 10 caracteres
  if (identificacion.length > 13) {
    return { message: "La identificación no debe exceder los 10 caracteres" };
  }

  const soapUrl =
    "https://interoperabilidad.dinardap.gob.ec/interoperador-v2?wsdl";

  const soapEnvelope = `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:int="http://interoperabilidad.dinardap.gob.ec/interoperador/">
        <soapenv:Header/>
        <soapenv:Body>
           <int:consultar>        
              <parametros>            
                 <parametro>              
                    <nombre>codigoPaquete</nombre>              
                    <valor>${codigoPaquete}</valor>
                 </parametro>
                 <parametro>              
                    <nombre>identificacion</nombre>              
                    <valor>${identificacion}</valor>
                 </parametro>
                 <parametro>              
                    <nombre>fuenteDatos</nombre>              
                    <valor> </valor>
                  </parametro>                                         
              </parametros>
           </int:consultar>
        </soapenv:Body>
    </soapenv:Envelope>
    `;

  const auth = {
    username: process.env.SOAP_USERNAME,
    password: process.env.SOAP_PASSWORD,
  };

  try {
    // Realizando la solicitud POST con axios
    const response = await axios.post(soapUrl, soapEnvelope, {
      headers: {
        "Content-Type": "text/xml", // Tipo de contenido para SOAP
        Authorization: `Basic ${Buffer.from(
          `${auth.username}:${auth.password}`
        ).toString("base64")}`,
      },
    });

    // Parsear la respuesta XML a JSON usando xml2js
    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedResponse = await parser.parseStringPromise(response.data);
    console.log(JSON.stringify(parsedResponse, null, 2));
    // Simplificar el JSON
    const simpleJson = standardizeEntities(response.data);
    return simpleJson;
  } catch (error) {
    //console.error("Error al consumir el servicio SOAP:", error);
    return {
      message:
        "No se pudo consultar la CEDULA: " +
        identificacion +
        "con error:" +
        error.message,
    };
  }
}
// Función para estandarizar el XML
function standardizeEntities(xmlData) {
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });

  return new Promise((resolve, reject) => {
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        reject(err);
      } else {
        // Aseguramos que 'entidad' sea un array, incluso si es un solo objeto
        const entidades = (
          Array.isArray(
            result["soap:Envelope"]["soap:Body"]["ns2:consultarResponse"]
              .paquete.entidades.entidad
          )
            ? result["soap:Envelope"]["soap:Body"]["ns2:consultarResponse"]
                .paquete.entidades.entidad
            : [
                result["soap:Envelope"]["soap:Body"]["ns2:consultarResponse"]
                  .paquete.entidades.entidad,
              ]
        ).map((entidad) => {
          // Empezamos con un objeto base para estandarizar la entidad
          const estandarizada = {
            nombre: entidad.nombre,
            data: [], // Iniciamos un array para las filas procesadas
          };

          // Procesamos las filas
          (Array.isArray(entidad.filas)
            ? entidad.filas
            : [entidad.filas]
          ).forEach((fila) => {
            const filas = Array.isArray(fila.fila) ? fila.fila : [fila.fila];
            filas.forEach((f_columnas) => {
              const columnaData = {};
              // Verificamos si 'columna' es un array
              const columnas = Array.isArray(f_columnas?.columnas?.columna)
                ? f_columnas?.columnas?.columna
                : [f_columnas?.columnas?.columna];

              // Procesamos cada columna de la fila
              columnas.forEach((columna) => {
                if (columna && columna.campo && columna.valor) {
                  columnaData[columna.campo] = columna.valor;
                }
              });

              // Agregamos los datos procesados a las filas
              estandarizada.data.push(columnaData);
            });
          });

          return estandarizada;
        });

        resolve({ entidades });
      }
    });
  });
}
