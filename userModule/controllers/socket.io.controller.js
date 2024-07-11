import { Server } from "socket.io";

// Crear instancia de Socket.IO
let io;

export const initializeSocket = (server) => {
  console.log(server);
  io = new Server(server, {
      cors: {
          origin: "*",
          methods: ["GET", "POST"],
      },
      path: '/new/socket.io' // Aquí especificas la ruta para los sockets
  });

  io.on('connection', (socket) => {
      console.log('a user connected:', socket.id);

      // Aquí puedes realizar acciones cuando un usuario se conecta
      // Por ejemplo, emitir un mensaje de bienvenida o agregarlo a una sala específica
      socket.emit('welcome', 'Welcome to the server!');

      // Manejar eventos específicos del usuario conectado
      socket.on('disconnect', () => {
          console.log('user disconnected:', socket.id);
          // Aquí puedes manejar acciones cuando un usuario se desconecta
      });
  });
};

export const notifyPermissionChange = (userId, action, permiso) => {
  if (io) {
    io.to(userId).emit("permissions-updated", { action, permiso });
  }
};

export const notifyRoleChange = (userId, action, roleId) => {
  if (io) {
    io.to(userId).emit("role-updated", { action, roleId });
  }
};

export default io;
