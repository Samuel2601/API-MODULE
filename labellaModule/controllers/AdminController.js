"use strict";

import bcrypt from "bcrypt-nodejs";
//import jwt from "../helpers/jwt.js";
import fs from "fs";
import handlebars from "handlebars";
import ejs from "ejs";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import path from "path";

import * as Model from "../models/Model.js";
import Registro from "../models/Registro.js";

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
const verificarCorreo = async function (req, res) {
  var id = req.params["id"];
  try {
    let usuario = await Model.Usuario.findOne({ correo: id });
    if (usuario) {
      res.status(200).send(true);
    } else {
      res.status(200).send(false);
    }
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error al obtener el usuario", error: error });
  }
};

const forgotpassword = async function (req, res) {
  var data = req.body;

  if (!data) {
    return res.status(400).json({ message: "Usuario requerido" });
  }

  try {
    admin_arr = await Model.Usuario.find({ email: data.email });
    if (admin_arr.length != 0) {
      if (element.estado != "Off") {
        const tokenfp = '';//jwt.sign(admin_arr[0]);
        verificarlink = "http://incorp.tk/" + `new-password/${tokenfp}`;
        admin_arr[0].password = undefined;
        console.log(verificarlink);
        enviar_password(verificarlink, admin_arr[0]);
        return res
          .status(200)
          .json({ message: "Revisa tu bandeja de mensajes" });
      } else {
        return res
          .status(200)
          .json({ message: "Revisa tu bandeja de mensajes" });
      }
    }
  } catch (error) {
    return res.status(200).json({ message: "Revisa tu bandeja de mensajes" });
  }
};
const obtener_portada = async function (req, res) {
  var img = req.params["img"];

  fs.stat("./uploads/incidentes/" + img, function (err) {
    if (!err) {
      let path_img = "./uploads/incidentes/" + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/default.jpg";
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
};
const obtener_portada_avatar = async function (req, res) {
  var img = req.params["img"];

  fs.stat("./uploads/avatar/" + img, function (err) {
    if (!err) {
      let path_img = "./uploads/avatar/" + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/default.jpg";
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
};
const obtener_portada_ficha = async function (req, res) {
  var img = req.params["img"];

  fs.stat("./uploads/fichas/" + img, function (err) {
    if (!err) {
      let path_img = "./uploads/fichas/" + img;
      res.status(200).sendFile(path.resolve(path_img));
    } else {
      let path_img = "./uploads/default.jpg";
      res.status(200).sendFile(path.resolve(path_img));
    }
  });
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

const Controller= {
  obtener_portada,
  newpassword,
  forgotpassword,
  listar_registro,
  verificar_token,
  obtener_portada_avatar,
  obtener_portada_ficha,
  obtener_portada_barrio,
  verificarCorreo,
};

export default Controller;