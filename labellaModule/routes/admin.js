'use strict';

import express from 'express';
import Controller from '../controllers/AdminController.js';

import multiparty from 'connect-multiparty';
import { getCiudadano } from '../../apiservices/sinardap.js';
import { auth } from '../../middlewares/validationResultExpress.js';

const path = multiparty({ uploadDir: './uploads/instituciones' });
const admin = express.Router();
admin.get('/obtener_portada/:img', Controller.obtener_portada);
admin.get('/obtener_portada_avatar/:img', Controller.obtener_portada_avatar);
admin.get('/obtener_portada_ficha/:img', Controller.obtener_portada_ficha);
admin.get('/obtener_portada_barrio/:img', Controller.obtener_portada_barrio);
admin.post('/newpassword', auth, Controller.newpassword);
admin.post('/forgotpassword', Controller.forgotpassword);
admin.get('/listar_registro', auth, Controller.listar_registro);
admin.get('/verificar_token', auth, Controller.verificar_token);
admin.get('/verificarcorreo/:id', Controller.verificarCorreo);

admin.get('/getciudadano/:id', async (req, res) => {
    var id = req.params['id'];
    console.log(id);
    try {
        const ciudadano = await getCiudadano(id);
        res.status(200).json(ciudadano);
    } catch (error) {
        console.error('Error al obtener ciudadano:', error);
        res.status(500).json({ message: 'Error al obtener ciudadano' });
    }
});

export default admin;
