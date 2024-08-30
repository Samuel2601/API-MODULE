import cron from "node-cron";
import { exec } from "child_process";
import { google } from "googleapis";
import { authenticate } from "@google-cloud/local-auth";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Response structure
const response = {
  status: 404, // Can be 'SUCCESS_CODE' or 'ERROR_CODE'
  data: null, // Response data
  message: null, // Descriptive message (optional)
  error: null, // Error details (optional)
};
function cloneResponse() {
  return { ...response };
}

// Obtener el nombre del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta donde se guardará el backup
const backupDir = path.join(__dirname, "backups");

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Función para subir el backup a Google Drive
async function uploadBackupToDrive(filePath) {
  // Carga el archivo de credenciales de la cuenta de servicio
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const driveService = google.drive({ version: "v3", auth });

  const fileMetadata = {
    name: path.basename(filePath),
  };

  const media = {
    mimeType: "application/gzip",
    body: fs.createReadStream(filePath),
  };

  try {
    const response = await driveService.files.create({
      resource: fileMetadata,
      media: media,
      fields: "id",
    });

    console.log(`Backup subido a Google Drive con ID: ${response.data.id}`);
  } catch (error) {
    console.error("Error subiendo el archivo:", error);
  }
}

// Función para transferir el backup a una computadora local usando `scp`
function transferBackupToLocal(filePath, remotePath) {
  // Asegúrate de reemplazar con tus valores
  const usuario = "USUARIO"; // Tu nombre de usuario en Windows
  const ip_remota = "192.168.120.71"; // La IP de tu computadora local
  const command = `scp ${filePath} ${usuario}@${ip_remota}:${remotePath.replace(
    /\\/g,
    "/"
  )}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al transferir el backup: ${error.message}`);
      return;
    }
    console.log("Backup transferido correctamente a la computadora local");
  });
}

export async function generateAndTransferBackup() {
  let response = cloneResponse();
  const fileName = `backup-${new Date().toISOString().split("T")[0]}.gz`;
  const filePath = path.join(backupDir, fileName);

  // Comando para hacer el dump de MongoDB
  const command = `mongodump --uri="mongodb://localhost:27017/${process.env.BASE_DATOS}" --archive=${filePath} --gzip`;

  exec(command, async (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al generar el backup: ${error.message}`);
      response.status = 500;
      response.message = "Algo salió mal";
      response.error = error.message;
      return;
    }

    console.log(`Backup generado correctamente: ${filePath}`);

    try {
      // Subir el archivo a Google Drive
      await uploadBackupToDrive(filePath);

      // Transferir el archivo a una computadora local
      const remotePath = "C:/Users/USUARIO/Documents/backup";
      transferBackupToLocal(filePath, remotePath);

      console.log("BackUp realizado");
      response.status = 200;
      response.message = "Data retrieved successfully";
    } catch (err) {
      console.error(`Error en la transferencia o subida: ${err.message}`);
      response.status = 500;
      response.message = "Algo salió mal";
      response.error = error.message; // Proporciona más detalles del error
    }
  });

  return response;
}

// Programar el cron job para que se ejecute diariamente
cron.schedule("0 0 * * *", generateAndTransferBackup);
