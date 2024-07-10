import nodemailer from "nodemailer";
import axios from "axios";
import handlebars from "handlebars";
import fs from "fs";
import ejs from "ejs";
import path from "path";
import { Model } from "../../models/exporSchema.js";
import * as bcrypt from "bcrypt-nodejs";

const transporter = nodemailer.createTransport({
  host: "mail.esmeraldas.gob.ec",
  port: 465,
  secure: true,
  auth: {
    user: "aplicaciones@esmeraldas.gob.ec",
    pass: "Alcaldia2024/*",
  },
});

async function hashPassword(password) {
  return await new Promise((resolve, reject) => {
    bcrypt.hash(password, null, null, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

const readHTMLFile = function (path, callback) {
  fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
    if (err) {      
      callback(err);
    } else {
      callback(null, html);
    }
  });
};


export async function recoverPassword(req, res) {

  const { email, recaptcha } = req.body;
  console.log("Correo ha recuperar:", email);
  const recaptchaSecretKey = "6LcXafYpAAAAAIrSo77FKAYJQA8TorXzbF94DUN9";
  const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptcha}`;

  try {
    const recaptchaResponse = await axios.post(recaptchaUrl);

    if (!recaptchaResponse.data.success) {
      return res
        .status(400)
        .json({ message: "Falló la verificación de reCAPTCHA" });
    }

    const usuario = await Model.User.findOne({ email: email });
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const temporaryPassword = Math.random().toString(36).slice(-8);
    usuario.password_temp = await hashPassword(temporaryPassword);
    await usuario.save();

    console.log(process.cwd() + "/userModule/contacModule/mails/email_password.html");
    readHTMLFile(process.cwd() + "/userModule/contacModule/mails/email_password.html", (err, html) => {
      if (err) {
        console.error("Error al leer el archivo HTML:", err);
        return res.status(500).json({ message: "Error interno del servidor" });
      }

      const rest_html = ejs.render(html, {
        numverf: temporaryPassword,
        usuario: usuario,
      });

      const template = handlebars.compile(rest_html);
      const htmlToSend = template({ op: true });

      const mailOptions = {
        from: "aplicaciones@esmeraldas.gob.ec",
        to: email,
        subject: "Recuperación de contraseña",
        priority: "high",
        text: `Tu clave temporal es: ${temporaryPassword}`,
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.error("Error al enviar el email:", error);
          return res.status(500).json({ message: "Algo salió mal" });
        } else {
          console.log("Email sent: " + info.response);
          res.status(200).json({
            message:
              "Revisa tu email, te hemos enviado un código de validación.",
          });
        }
      });
    });
  } catch (error) {
    console.error(
      "Error en la verificación de reCAPTCHA o en el envío del email:",
      error
    );
    res.status(500).json({ message: "Error interno del servidor" });
  }
}

