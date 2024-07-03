import express from 'express';
import { recoverPassword } from '../controllers/PasswordReset.js';

const pass = express.Router();

pass.post('/recover-password', recoverPassword);

export default pass;
