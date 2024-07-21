"use strict";

import bcrypt from "bcrypt-nodejs";
//import jwt from "../helpers/jwt.js";
import fs from "fs";
import handlebars from "handlebars";
import ejs from "ejs";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import path from "path";

import Registro from "../models/Registro.js";
import { models } from "../models/Modelold.js";

//import listarArchivos from "./FilesystemController.js";

const verificar_token = async function (req, res) {
  ////////console.log(req.user);
  if (req.user) {
    res.status(200).send({ data: req.user });
  } else {
    ////////console.log(2);
    res.status(500).send({ message: "NoAccess" });
  }
};

const obtener_portada_barrio = async function (req, res) {
  var img = req.params["img"];

  // Obtener la lista de archivos en el directorio
  fs.readdir("./uploads/barrios/", (err, files) => {
    if (err) {
      console.error(err);
      let path_img = "./uploads/default.jpg";
      return res.status(200).sendFile(path.resolve(path_img));
    }

    // Buscar la primera imagen que coincida con el nombre
    let matchingFile = files.find((file) => file.startsWith(img));
    if (matchingFile) {
      let path_img = "./uploads/barrios/" + matchingFile;
      return res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/barrios/default.jpg";
      return res.status(200).sendFile(path.resolve(path_img));
    }
  });
};

const enviar_password = async function (link, userdata) {
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

    readHTMLFile(process.cwd() + "/mails/email_password.html", (err, html) => {
      let rest_html = ejs.render(html, { userdata: userdata, link: link });

      var template = handlebars.compile(rest_html);
      var htmlToSend = template({ op: true });

      var mailOptions = {
        from: "incorp.odoo1@gmail.com",
        to: userdata.email,
        subject: "Cambio de contraseña",
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (!error) {
          console.log("Email sent: " + info.response);
        }
      });
    });
  } catch (error) {
    res.status(200).send({ message: "Algo salio mal" });
  }
};
const newpassword = async function (req, res) {
  if (req.user) {
    try {
      var data = req.body;
      bcrypt.hash(data.password, null, null, async function (err, hash) {
        if (hash) {
          data.password = hash;
          await Model.Usuario.updateOne(
            { _id: req.user.sub },
            {
              password: data.password,
            }
          );
          let registro = {};
          registro.admin = req.user.sub;
          registro.tipo = "actualizo";
          registro.descripcion = JSON.stringify(data);
          await Registro.create(registro);
          res.status(200).send({ message: "Actualizado con exito" });
        }
      });
    } catch (error) {
      res.status(200).send({ message: "Algo salio mal" });
    }
  } else {
    res.status(200).send({ message: "NoAccess" });
  }
};

const listar_registro = async function (req, res) {
  if (req.user) {
    try {
      const registro = await Registro.find({}).sort({ createdAt: -1 });
      res.status(200).send({ data: registro });
    } catch (error) {
      res.status(200).send({ message: "Algo salió mal", data: undefined });
    }
  } else {
    res.status(500).send({ message: "NoAccess" });
  }
};

const enviar_orden_compra = async function (pago) {
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

    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "pagos@egbfcristorey.edu.ec",
          pass: "nxewlthjhaqhqgqb",
        },
      })
    );

    var orden = await Pago.findById({ _id: pago }).populate("estudiante");
    var dventa = await Dventa.find({ venta: venta })
      .populate("producto")
      .populate("variedad");

    readHTMLFile(process.cwd() + "/mails/email_compra.html", (err, html) => {
      let rest_html = ejs.render(html, { orden: orden, dpago: dpago });

      var template = handlebars.compile(rest_html);
      var htmlToSend = template({ op: true });

      var mailOptions = {
        from: "pagos@egbfcristorey.edu.ec",
        to: orden.estudiante.email,
        subject: "Confirmación de pago " + orden._id,
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (!error) {
          ////console.log('Email sent: ' + info.response);
        }
      });
    });
  } catch (error) {
    ////console.log(error);
  }
};
const mail_confirmar_envio = async function (pago) {
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

    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "incorp.odoo1@gmail.com",
          pass: "vnixbyewlzmrqchw",
          //user: 'pagos@egbfcristorey.edu.ec',
          //pass: 'nxewlthjhaqhqgqb',
        },
      })
    );

    var orden = await Pago.findById({ _id: pago }).populate("estudiante");
    orden.currency = "USD";
    //////console.log(orden);
    var dpago = await Dpago.find({ pago: pago }).populate("documento");
    // ////console.log(dpago);

    readHTMLFile(process.cwd() + "/mails/email_enviado.html", (err, html) => {
      let rest_html = ejs.render(html, { orden: orden, dpago: dpago });

      var template = handlebars.compile(rest_html);
      var htmlToSend = template({ op: true });

      var mailOptions = {
        from: "pagos@egbfcristorey.edu.ec",
        to: orden.estudiante.email,
        subject: "Tu pago " + orden._id + " fué registrado",
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (!error) {
          ////console.log('Email sent: ' + info.response);
        }
      });
    });
  } catch (error) {
    ////console.log(error);
  }
};
const enviar_email_pedido_compra = async function (pago) {
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

    var transporter = nodemailer.createTransport(
      smtpTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
          user: "diegoalonssoac@gmail.com",
          pass: "dcmplvjviofjojgf",
        },
      })
    );

    var orden = await Pago.findById({ _id: pago }).populate("estudiante");
    var dpago = await Dpago.find({ pago: pago }).populate("documento");

    readHTMLFile(process.cwd() + "/mails/email_pedido.html", (err, html) => {
      let rest_html = ejs.render(html, { orden: orden, dpago: dpago });

      var template = handlebars.compile(rest_html);
      var htmlToSend = template({ op: true });

      var mailOptions = {
        from: "diegoalonssoac@gmail.com",
        to: orden.estudiante.email,
        subject: "Gracias por tu orden, Prágol.",
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (!error) {
          ////////console.log('Email sent: ' + info.response);
        }
      });
    });
  } catch (error) {
    ////////console.log(error);
  }
};

export const actualizarFichaMeGusta = async function (req, res) {
  const { id_ficha } = req.params;
  const { id_user } = req.body;

  try {
      // Encuentra la ficha y actualiza la lista de "me gusta"
      const ficha = await models.Ficha_sectorial.findById(id_ficha);

      if (!ficha) {
          return res.status(404).json({ message: 'Ficha no encontrada' });
      }

      // Verifica si el usuario ya ha dado "me gusta"
      const index = ficha.me_gusta.indexOf(id_user);

      if (index === -1) {
          // Si no está presente, añade el ID del usuario a la lista de "me gusta"
          ficha.me_gusta.push(id_user);
      } else {
          // Si está presente, quita el ID del usuario de la lista de "me gusta"
          ficha.me_gusta.splice(index, 1);
      }

      await ficha.save();

      res.status(200).json({ message: 'Me gusta actualizado correctamente', me_gusta: ficha.me_gusta });
  } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el "me gusta"', error });
  }
};

export const actualizarFichaCompartido = async function (req, res) {
  const { id_ficha } = req.params;

  try {
      // Encuentra la ficha y actualiza el contador de "compartido"
      const ficha = await models.Ficha_sectorial.findById(id_ficha);

      if (!ficha) {
          return res.status(404).json({ message: 'Ficha no encontrada' });
      }

      // Incrementa el contador de "compartido"
      ficha.compartido += 1;

      await ficha.save();

      res.status(200).json({ message: 'Contador de compartido actualizado correctamente', compartido: ficha.compartido });
  } catch (error) {
      res.status(500).json({ message: 'Error al actualizar el contador de compartido', error });
  }
};

