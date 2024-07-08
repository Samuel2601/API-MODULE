import mongoose from "mongoose";
import { SchemaModelOld } from "../labellaModule/models/Modelold.js";
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
    const rolesAntiguos = await consultAngiguo(
      "buzon",
      "rol_user",
      SchemaModelOld.RolUserSchema
    ); //Rol_user.find({});

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
    const usuariosAntiguos = await consultAngiguo(
      "buzon",
      "usuario",
      SchemaModelOld.UsuarioSchema
    );

    // Iterar sobre cada usuario y crear un nuevo registro si no existe
    for (const usuario of usuariosAntiguos) {
      // Verificar si el registro ya existe en el nuevo esquema por _id o email
      const usuarioExistentePorId = await Model.User.findById(usuario._id);
      const usuarioExistentePorEmail = await Model.User.findOne({
        email: usuario.correo,
      });

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

const consultAngiguo = async (base, register, schema) => {
  let conn = mongoose.connection.useDb(base); //labella //buzon
  schema = conn.model(register, schema); // SchemaModelOld.UsuarioSchema
  return await schema.find();
};

const autoguardarPermisos = async (app) => {
  let routes = [];
  let contador = 0;
  let errores = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Si es una ruta directa
      const { path, methods } = middleware.route;
      Object.keys(methods).forEach(method => {
        routes.push({ path, method });
      });
    } else if (middleware.name === "router") {
      // Si es un router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const { path, methods } = handler.route;
          Object.keys(methods).forEach(method => {
            routes.push({ path, method });
          });
        }
      });
    }
  });

  // Verificar si existe el rol de administrador
  const adminRole = await Model.Role.findOne({ name: { $in: ['Administrador', 'Admin'] } });
  if (!adminRole) {
    console.error('No se encontró el rol de Administrador o Admin');
    return;
  }

  for (const route of routes) {
    
    try {
      const permiso = new Model.Permiso({
        name: route.path,
        method: route.method.toLowerCase(),
      });
      await permiso.save();
      contador++;
      
      // Actualiza el rol de administrador con el nuevo permiso
      await Model.Role.updateOne(
        { _id: adminRole._id }, // Usar el ID del rol de administrador encontrado
        { $addToSet: { permisos: permiso._id } } // Añade el permiso si no está ya presente
      );

    } catch (error) {
      if (error.code === 11000) {
        // Error de duplicado
        errores.push(`Ruta duplicada: ${route.path} [${route.method.toLowerCase()}]`);
      } else {
        errores.push(`Error al guardar la ruta ${route.path} [${route.method.toLowerCase()}]: ${error.message}`);
      }
    }
  }

  console.log(`Permisos guardados: ${contador}`);
  if (errores.length) {
    console.error("Errores:", errores);
  }
};

export { usuarios, roles, permiso, autoguardarPermisos };
