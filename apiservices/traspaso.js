import { Model } from "../userModule/models/exporSchema.js";
const permiso = async () => {
  try {
    let contador = 0; // Contador para los registros traspasados

    // Leer todos los registros del esquema antiguo
    const permisoAntiguo = await Model.Permiso.find({});

    // Iterar sobre cada permiso y crear o actualizar un nuevo registro
    for (const permiso of permisoAntiguo) {
      // Usar updateOne para crear o actualizar el registro
      const resultadoUpdate = await Model.Permiso.updateOne(
        { _id: permiso._id }, // Condición para encontrar el registro
        { name: permiso.nombreComponente } // Actualizar o establecer el nuevo documento
      );
      contador++; // Incrementar el contador
    }

    console.log(
      `Migración de permisos completada exitosamente. Se modificaron ${contador} registros.`
    );
  } catch (error) {
    console.error(error);
  }
};

const roles = async () => {
  try {
    let contador = 0; // Contador para los registros traspasados

    // Leer todos los registros del esquema antiguo
    const rolesAntiguos = await Model.Rol_user.find({});

    // Iterar sobre cada rol y crear un nuevo registro
    for (const rol of rolesAntiguos) {
      // Verificar si el registro ya existe en el nuevo esquema
      const rolExistente = await Model.Role.findById(rol._id);

      if (!rolExistente) {
        const rolNuevo = new Model.Role({
          _id: rol._id,
          name: rol.nombre,
          orden: rol.orden,
          createdAt: rol.createdAt,
        });

        await rolNuevo.save();
        contador++; // Incrementar el contador
      } else {
        /*console.log(
          `El rol con _id: ${rol._id} ya existe en el nuevo esquema.`
        );*/
      }
    }

    console.log(
      `Migración de roles completada exitosamente. Se traspasaron ${contador} registros.`
    );
  } catch (error) {
    console.error(error);
  }
};

const usuarios = async () => {
  try {
    let contador = 0; // Contador para los registros traspasados

    // Leer todos los registros del esquema antiguo
    const usuariosAntiguos = await Model.Usuario.find({});

    // Iterar sobre cada usuario y crear un nuevo registro si no existe
    for (const usuario of usuariosAntiguos) {
      // Verificar si el registro ya existe en el nuevo esquema por _id o email
      const usuarioExistentePorId = await Model.User.findById(usuario._id);
      const usuarioExistentePorEmail = await Model.User.findOne({ email: usuario.correo });

      if (!usuarioExistentePorId && !usuarioExistentePorEmail) {
        let nombresArray = usuario.nombres.split(" ");
        let name = "";
        let last_name = "";

        if (nombresArray.length === 1) {
          name = nombresArray[0];
        } else if (nombresArray.length === 2) {
          name = nombresArray[0];
          last_name = nombresArray[1];
        } else if (nombresArray.length === 3) {
          name = nombresArray[0];
          last_name = nombresArray.slice(1).join(" ");
        } else if (nombresArray.length === 4) {
          name = nombresArray.slice(0, 2).join(" ");
          last_name = nombresArray.slice(2).join(" ");
        } else {
          name = nombresArray.slice(0, 2).join(" ");
          last_name = nombresArray.slice(2).join(" ");
        }

        const usuarioNuevo = new Model.User({
          _id: usuario._id,
          dni: usuario.cedula,
          name: name || "", // Asignar un valor por defecto si no está presente
          last_name: last_name || "", // Asignar un valor por defecto si no está presente
          telf: usuario.telefono,
          email: usuario.correo,
          password: usuario.password,
          password_temp: usuario.password_temp,
          verificado: false, // Nuevo campo, asignar valor por defecto
          status: usuario.estado === "On",
          role: usuario.rol_user,
          googleId: usuario.googleId,
          facebookId: usuario.facebookId,
          photo: usuario.foto,
          verificationCode: "", // Nuevo campo, asignar valor por defecto
          createdAt: usuario.createdAt,
        });

        await usuarioNuevo.save();
        contador++; // Incrementar el contador
      } else {
        if (usuarioExistentePorId) {
          /*console.log(
            `El usuario con _id: ${usuario._id} ya existe en el nuevo esquema.`
          );*/
        } else {
          console.log(
            `El usuario con email: ${usuario.correo} ya existe en el nuevo esquema.`
          );
        }
      }
    }

    console.log(
      `Migración de usuarios completada exitosamente. Se traspasaron ${contador} registros.`
    );
  } catch (error) {
    console.error(error);
  }
};


export { usuarios, roles, permiso };
