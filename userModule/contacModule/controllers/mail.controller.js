"use strict";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import handlebars from "handlebars";
import { Model } from "../../models/exporSchema.js";
import axios from "axios";
import fs from "fs";
import ejs from "ejs";
import path from "path";

const mail_confirmar_session = async function (email) {
  try {
    var readHTMLFile = function (path, callback) {
      fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
        if (err) {
          throw err;
          callback(err);
        } else {
          callback(null, html);
        }
      });
    };
    /*
    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "incorp.odoo1@gmail.com",
          pass: "vnixbyewlzmrqchw",
        },
      })
    );
    */
    const usuario = await Model.User.findOne({ email: email });
    if (usuario) {
      const min = 100;
      const max = 9999;
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      const verificationCode = String(randomNum).padStart(4, "0");

      // Guardar el código de verificación en el usuario
      usuario.verificationCode = verificationCode;
      await usuario.save();
      readHTMLFile(
        //process.cwd() + "/userModule/mailModule/mails/email_verif.html", //REVISAR BUSQUEDA DE PLANTILLA
        path.resolve(process.cwd(), "./userModule/contacModule/mails", "email_verif.html"),
        (err, html) => {
          let rest_html = ejs.render(html, {
            numverf: verificationCode,
            usuario: usuario,
          });

          var template = handlebars.compile(rest_html);
          var htmlToSend = template({ op: true });

          var mailOptions = {
            from: "aplicaciones@esmeraldas.gob.ec",
            //sender: "noreply@miempresa.com",
            to: usuario.email,
            subject: "Tu código de un solo uso",
            priority: "high",
            text: `Aquí está tu código de verificación: ${verificationCode}`,
            html: htmlToSend,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (!error) {
              console.log("Email sent: " + info.response);
              return "Revisa tu corrreo, te hemos enviado un codigo de validadicón.";
            } else {
              console.error(error);
              return "Algo salio mal";
            }
          });
        }
      );
    }
  } catch (error) {
    console.error(error);
    return "Algo salio mal";
  }
};

const transporter = nodemailer.createTransport({
  host: "mail.esmeraldas.gob.ec",
  port: 465,
  secure: true,
  auth: {
    user: "aplicaciones@esmeraldas.gob.ec",
    pass: "Alcaldia2024/*",
  },
});

async function recoverPassword(req, res) {
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

  const { email, recaptcha } = req.body;

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

    if (usuario) {
      const temporaryPassword = Math.random().toString(36).slice(-8);
      usuario.password_temp = temporaryPassword;
      await usuario.save();
      readHTMLFile(
        path.resolve(process.cwd(), "/userModule/contacModule/mails", "email_password.html"), //REVISAR BUSQUEDA DE PLANTILLA
        (err, html) => {
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

export { mail_confirmar_session,recoverPassword };
