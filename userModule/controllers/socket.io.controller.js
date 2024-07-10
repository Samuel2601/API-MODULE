import { Server } from "socket.io";

// Crear instancia de Socket.IO
let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);
  });
};

export const notifyPermissionChange = (userId, action, permiso) => {
  if (io) {
    io.to(userId).emit("permissions-updated", { action, permiso });
  }
};

export const notifyRoleChange = (userId, action, roleId) => {
  if (io) {
    io.to(userId).emit('role-updated', { action, roleId });
  }
};

export default io;
