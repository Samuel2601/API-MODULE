// Función que realiza la consulta SOAP
import axios from "axios";
import xml2js from "xml2js";

export async function consultarCedula(identificacion) {
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
                    <valor>3790</valor>
                 </parametro>
                 <parametro>              
                    <nombre>identificacion</nombre>              
                    <valor>${identificacion}</valor>
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

    return parsedResponse; // Devuelve la respuesta completa en formato JSON
  } catch (error) {
    console.error("Error al consumir el servicio SOAP:", error);
    throw error;
  }
}
