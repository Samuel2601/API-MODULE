import cron from "node-cron";
import { exec } from "child_process";
import { google } from "googleapis";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { NodeSSH } from "node-ssh";
const ssh = new NodeSSH();
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

//Función para listar archivos
export async function listAppdata() {
  let response = cloneResponse();

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"),
    scopes: "https://www.googleapis.com/auth/drive",
  });
  const service = google.drive({ version: "v3", auth });
  try {
    const res = await service.files.list({
      //spaces: "",
      fields: "nextPageToken, files(id, name)",
      pageSize: 100,
    });
    res.data.files.forEach(function (file) {
      console.log("Found file:", file.name, file.id);
    });
    response.status = 200;
    response.message = "Data retrieved successfully";
    response.data = res.data.files;
  } catch (error) {
    console.error(`Errror al listar los backups: ${error}`);
    response.status = 500;
    response.message = "Algo salió mal";
    response.error = error;
  }

  return response;
}

// Función para actualizar permisos y generar un enlace de compartición
export async function shareFile(fileId) {
  let response = cloneResponse();

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"),
    scopes: "https://www.googleapis.com/auth/drive",
  });

  const driveService = google.drive({ version: "v3", auth });

  try {
    // Actualizar permisos del archivo
    await driveService.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader", // Permiso de solo lectura
        type: "anyone", // Acceso para cualquier persona con el enlace
      },
    });

    // Generar el enlace de compartición
    const file = await driveService.files.get({
      fileId: fileId,
      fields: "webViewLink",
    });

    response.status = 200;
    response.message = "File shared successfully";
    response.data = {
      fileId: fileId,
      shareableLink: file.data.webViewLink,
    };
  } catch (error) {
    console.error(`Error al compartir el archivo: ${error}`);
    response.status = 500;
    response.message = "Algo salió mal";
    response.error = error;
  }

  return response;
}

// Función para eliminar un archivo de Google Drive
export async function deleteFile(fileId) {
  let response = cloneResponse();

  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, "credentials.json"),
    scopes: "https://www.googleapis.com/auth/drive",
  });

  const driveService = google.drive({ version: "v3", auth });

  try {
    // Eliminar el archivo
    await driveService.files.delete({
      fileId: fileId,
    });

    response.status = 200;
    response.message = "File deleted successfully";
    response.data = {
      fileId: fileId,
    };
  } catch (error) {
    console.error(`Error al eliminar el archivo: ${error}`);
    response.status = 500;
    response.message = "Algo salió mal";
    response.error = error;
  }

  return response;
}

// Función para transferir el backup a una computadora local usando `scp`
async function transferBackupToLocal(filePath, remotePath) {
  const usuario = "USUARIO";
  const ip_remota = "192.168.120.71";
  const password = "485314";

  // Comando `scp` usando `sshpass` para proporcionar la contraseña
  const command = `sshpass -p '${password}' scp ${filePath} ${usuario}@${ip_remota}:${remotePath.replace(
    /\\/g,
    "/"
  )}`;

  console.log("Comando por ejecutar: ", command);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error al transferir el backup: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Detalles del error: ${stderr}`);
    }
    console.log("Backup transferido correctamente a la computadora local");
  });
}

export async function generateAndTransferBackup() {
  let response = cloneResponse();
  const now = new Date();
  const fileName = `backup-${
    now.toISOString().split("T")[0]
  }-${now.getHours()}-${now.getMinutes()}-${now.getSeconds()}.gz`;

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
      await transferBackupToLocal(filePath, remotePath);

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
cron.schedule("0 19 * * *", generateAndTransferBackup);
