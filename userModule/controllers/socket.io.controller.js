import * as io from "socket.io";

// Ejemplo de cómo emitir un evento de cambio de permisos
export const notifyPermissionChange = (userId, action, permiso) => {
  io.to(userId).emit("permissions-updated", { action, permiso });
};

export const notifyRoleChange = (userId, action, roleId) => {
  io.to(userId).emit('role-updated', { action, roleId });
};