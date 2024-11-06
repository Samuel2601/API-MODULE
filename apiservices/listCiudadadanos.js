import axios from "axios";

import fs from "fs";
import { getCiudadano } from "./sinardap.js";

export async function verifyCiudadanos() {
  // Sample list of names and cedulas
  const list = [
    { nombre: "NADIA FERNANDA CASTRO ESTACIO", cedula: "0802797951" },
    { nombre: "AQUILES ARISMENDI DIAZ", cedula: "0800510653" },
    { nombre: "ANGEL AQUILES ARISMENDIA MOSQUERA", cedula: "0802374793" },
    { nombre: "ANA TERESA PALACIOS MORELAES", cedula: "0801798034" },
    { nombre: "ROBERTH GONZALEZ MEDINA", cedula: "0801361064" },
    { nombre: "WINTELH PRECIADO", cedula: "0801637984" },
    { nombre: "LENNY SEGURA RAMIREZ", cedula: "0801020355" },
    { nombre: "JOSE PONCE MEZA", cedula: "0800391674" },
    { nombre: "MIRIAN VILLEGAS NUÑEZ", cedula: "1202120588" },
    { nombre: "LORENA ORDOÑEZ QUINTERO", cedula: "0801863150" },
    { nombre: "GARY CETRE CETRE", cedula: "0801429200" },
    { nombre: "DONALD MICOLTA ANGULO", cedula: "0800968976" },
    { nombre: "CESAR JARAMILLO", cedula: "0801175852" },
    { nombre: "NARCISA PEÑARANDA LOPÉZ", cedula: "0104505599" },
    { nombre: "MARLON MATAMBA PUERTA", cedula: "0800635104" },
    { nombre: "ENRIQUE TORRES CASTILLO", cedula: "0800977647" },
    { nombre: "CECIBEL PORTOCARRERO MEJIA", cedula: "1727038778" },
    { nombre: "OLINDA ALEXANDRA ZAMORA B.", cedula: "0802063602" },
    { nombre: "GINA PERLAZA QUIÑONEZ", cedula: "0803841907" },
    { nombre: "EMILIANA NAZARENO CHARCOPA", cedula: "0803169168" },
    { nombre: "CARMEN VILELA BAUTISTA", cedula: "0800317968" },
    { nombre: "ANDRES SEGURA PRECIADO", cedula: "0801821232" },
    { nombre: "MELIZA MILAGRO QUIMI", cedula: "0802175687" },
    { nombre: "JOSE ZAMBRANO CASTILLO", cedula: "0802399451" },
    { nombre: "PATRICIO MINA OROBIO", cedula: "0801897125" },
    { nombre: "RONNY ARROYO DE LA CRUZ", cedula: "0802774240" },
    { nombre: "SAMUEL SANCHEZ MOREIRA", cedula: "0913624599" },
    { nombre: "CHARITO FRANCO MERO", cedula: "0800639775" },
    { nombre: "JORGE ESTUPIÑAN ACOSTA", cedula: "0800758823" },
    { nombre: "JOSEFINA BAUTISTA CUERO", cedula: "0800358574" },
    { nombre: "LUZ AMERICA VALENCIA CANGA", cedula: "" },
    { nombre: "MAYIN RAMO ECHEVERRIA", cedula: "0802126052" },
    { nombre: "ENRIQUE TENORIO VERNAZA", cedula: "0801304551" },
    { nombre: "AURA BANGUERA CAICEDO", cedula: "1758147753" },
    { nombre: "JUAN ALBERTO CASTILLO ORTIZ", cedula: "0801295536" },
    { nombre: "CECILIA MOSQUERA QUIROZ", cedula: "0802028738" },
    { nombre: "VENUS GRACIELA BALLESTERO SALMON", cedula: "0802559393" },
    { nombre: "NANCY QUENAMBU BURBANO", cedula: "0802017061" },
    { nombre: "LICIA INES VACA BONE", cedula: "0801129222" },
    { nombre: "JUAN CARLOS PONGUILLO", cedula: "0801890484" },
    { nombre: "MARÍA ANGELICA QUIÑONEZ GARCIA", cedula: "0802504902" },
    { nombre: "CINTHYA GONSALEZ SABANDO", cedula: "0803060581" },
    { nombre: "LENIN DAMIAN CAMPOS QUITO", cedula: "0802325449" },
    { nombre: "LINDER RENGIFO BAGUI", cedula: "1706214044" },
    { nombre: "NEL ORESTES VERNAZA", cedula: "0800507618" },
    { nombre: "PATRICIO ALEJANDRO MOREIRA ORTIZ", cedula: "0803043520" },
    { nombre: "CARLOS VILLA VILLA", cedula: "0601641053" },
    { nombre: "KIRMAN GUERRERO ORDOÑEZ", cedula: "1724066012" },
    { nombre: "JORGE DEMERA MERA", cedula: "0801679234" },
    { nombre: "JOSÉ VINICIO CEDEÑO ANCHUNDIA", cedula: "1707772875" },
  ];

  const results = {
    notFound: [],
    nameMismatch: [],
    deceased: [],
    emptyCedula: [],
  };

  for (const [index, record] of list.entries()) {
    const { nombre, cedula } = record;
    // Verifica si la cédula está vacía antes de llamar a getCiudadano
    if (!cedula) {
      //console.warn(`Registro ${index} tiene una cédula vacía.`);
      results.emptyCedula.push({ index, nombre, cedula: "Cédula vacía" });
      continue; // Saltar este registro y continuar con el siguiente
    }

    try {
      const ciudadano = await getCiudadano(cedula);
      // Verifica si el nombre coincide
      if (ciudadano.nombres !== nombre) {
        results.nameMismatch.push({
          index,
          cedula,
          nombre,
          foundName: ciudadano.nombres,
        });
      }
    } catch (error) {
      if (error.statusCode === 403) {
        results.deceased.push({ index, cedula, nombre });
      } else if (error.statusCode === 404) {
        results.notFound.push({ index, cedula, nombre });
      } else {
        console.error(
          `Unexpected error for record ${index} with cedula ${cedula}:`,
          error
        );
      }
    }
  }

  return results;
}
