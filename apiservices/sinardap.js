import axios from "axios";

export async function getCiudadano(cedula) {
  const axiosInstance = axios.create({
    baseURL: process.env.API_BASEURL,
    auth: {
      username: process.env.API_USER,
      password: process.env.API_PASS,
    },
  });
  const config = {
    url: process.env.API_URL,
    method: process.env.API_METHOD,
    params: {
      cedula: cedula,
    },
  };
  const e = new Error("El ciudadano consta como fallecido");
  e.statusCode = 403;
  try {
    const response = await axiosInstance.request(config);

    const ciudadano = response.data;

    if (ciudadano.fechaDefuncion) {
      throw e;
    }

    return ciudadano;
  } catch (error) {
    e.message = error.response.data;
    e.statusCode = error.response.status;
    throw e;
  }
}
