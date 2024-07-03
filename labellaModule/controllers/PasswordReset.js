import nodemailer from "nodemailer";
import axios from "axios";
import * as Model from "../models/Model.js";
import handlebars from "handlebars";
import fs from "fs";
import ejs from "ejs";
import path from "path";

const transporter = nodemailer.createTransport({
  host: "mail.esmeraldas.gob.ec",
  port: 465,
  secure: true,
  auth: {
    user: "aplicaciones@esmeraldas.gob.ec",
    pass: "Alcaldia2024/*",
  },
});

export async function recoverPassword(req, res) {
  const readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
      if (err) {
        throw err;
        callback(err);
      } else {
        callback(null, html);
      }
    });
  };

  const { correo, recaptcha } = req.body;

  const recaptchaSecretKey = "6LcXafYpAAAAAIrSo77FKAYJQA8TorXzbF94DUN9";
  const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecretKey}&response=${recaptcha}`;

  try {
    const recaptchaResponse = await axios.post(recaptchaUrl);

    if (!recaptchaResponse.data.success) {
      return res
        .status(400)
        .json({ message: "Falló la verificación de reCAPTCHA" });
    }

    const usuario = await Model.Usuario.findOne({ correo: correo });

    if (usuario) {
      const temporaryPassword = Math.random().toString(36).slice(-8);
      usuario.password_temp = temporaryPassword;
      await usuario.save();
      readHTMLFile(
        path.resolve(process.cwd(), "mails", "email_password.html"),
        (err, html) => {
          const rest_html = ejs.render(html, {
            numverf: temporaryPassword,
            usuario: usuario,
          });

          const template = handlebars.compile(rest_html);
          const htmlToSend = template({ op: true });

          const mailOptions = {
            from: "aplicaciones@esmeraldas.gob.ec",
            to: correo,
            subject: "Recuperación de contraseña",
            priority: "high",
            text: `Tu clave temporal es: ${temporaryPassword}`,
            html: htmlToSend,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (!error) {
              console.log("Email sent: " + info.response);

              res.status(200).json({
                message:
                  "Revisa tu correo, te hemos enviado un código de validación.",
              });
            } else {
              console.error(error);
              res.status(500).json({ message: "Algo salió mal" });
            }
          });
        }
      );
    }
  } catch (error) {
    console.error(
      "Error en la verificación de reCAPTCHA o en el envío del correo:",
      error
    );
    res.status(500).json({ message: "Error interno del servidor" });
  }
}
