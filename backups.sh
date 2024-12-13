#!/bin/bash
###########################################################
## Script para realizar backup y transferencia de Oracle ##
## FXGS                                                 ##
###########################################################

# Variables de entorno
export ORACLE_SID=bdesme
export ORACLE_HOME=/u01/app/oracle/product/10.2.0/db_1
export PATH=$PATH:$ORACLE_HOME/bin

# Variables del backup
BACKUP_DIR="/backups/oracle/temp"               # Directorio local para backups
REMOTE_USER="USUARIO"               # Usuario remoto
REMOTE_PASSWORD="485314"                   # Contraseña para sshpass
REMOTE_HOST="192.168.120.71"        # IP del servidor remoto
REMOTE_PATH="C:/Users/USUARIO/Documents/BACKUPS-ORACLE"  # Ruta remota
DATE=$(date +'%Y%m%d-%H%M%S')       # Fecha actual para nombres únicos
BACKUP_NAME="expsisesmer_${DATE}.dmp"  # Nombre del archivo de backup
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"  # Archivo de log

# Crear carpetas necesarias
mkdir -p "${BACKUP_DIR}"
touch "${LOG_FILE}"

# Función de log
log() {
    echo "$(date +'%Y-%m-%d %H:%M:%S') - $1" | tee -a "${LOG_FILE}"
}

# Verificar dependencias
check_dependencies() {
    log "Verificando dependencias..."
    for cmd in exp gzip sshpass scp; do
        if ! command -v "$cmd" &>/dev/null; then
            log "Error: $cmd no está instalado."
            read -p "¿Deseas instalar $cmd? (s/n): " choice
            if [[ "$choice" == "s" || "$choice" == "S" ]]; then
                case $cmd in
                    exp) sudo apt-get install oracle-client;; # Comando de ejemplo, depende de tu distribución
                    gzip) sudo apt-get install gzip;;
                    sshpass) sudo apt-get install sshpass;;
                    scp) sudo apt-get install openssh-client;;
                    *) log "Comando desconocido: $cmd";;
                esac
            else
                log "Puedes instalarlo manualmente utilizando los siguientes comandos:"
                echo "sudo apt-get install $cmd"
                exit 1
            fi
        fi
    done
    log "Todas las dependencias están presentes."
}

# Función para generar el backup de Oracle
generate_backup() {
    local start_time=$(date +%s)
    log "Iniciando generación del backup para Oracle..."
    exp sisesmer/294A315LS1S file="${BACKUP_DIR}/${BACKUP_NAME}" grants=n full=y

    if [ $? -ne 0 ]; then
        log "Error: Falló la generación del backup."
        exit 1
    fi
    log "Backup generado correctamente: ${BACKUP_NAME}"

    # Comprimir el archivo
    log "Comprimiendo el backup..."
    gzip -8 "${BACKUP_DIR}/${BACKUP_NAME}"

    if [ $? -ne 0 ]; then
        log "Error: Falló la compresión del archivo."
        exit 1
    fi
    local end_time=$(date +%s)
    local elapsed_time=$((end_time - start_time))
    local minutes=$((elapsed_time / 60))
    local seconds=$((elapsed_time % 60))
    log "Backup comprimido correctamente: ${BACKUP_NAME}.gz"
    log "Tiempo total para generar y comprimir el backup: ${elapsed_time} segundos"

    # Tamaño del archivo
    local backup_size=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.gz" | cut -f1)
    log "Tamaño del archivo comprimido: ${backup_size}"
}

# Verificar espacio disponible en el servidor remoto
check_remote_space() {
    log "Verificando espacio disponible en el servidor remoto..."
    local remote_space=""
    
    # Intentar obtener el espacio remoto
    remote_space=$(sshpass -p "${REMOTE_PASSWORD}" ssh "${REMOTE_USER}@${REMOTE_HOST}" 'df -h /' | awk 'NR==2 {print $4}')
    
    if [[ -z "${remote_space}" ]]; then
        # Si no se puede obtener el espacio, dar una advertencia pero continuar
        log "ADVERTENCIA: No se pudo verificar el espacio en el servidor remoto."
        log "Continuando con la transferencia, pero se recomienda verificar manualmente el espacio disponible."
        return 0  # Continuar con la ejecución
    fi
    
    log "Espacio disponible en el servidor remoto: ${remote_space}"
    return 0
}

# Función para transferir el backup a otro servidor
transfer_backup() {
    check_remote_space
    log "Iniciando transferencia del backup al host remoto..."
    sshpass -p "${REMOTE_PASSWORD}" scp "${BACKUP_DIR}/${BACKUP_NAME}.gz" ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}

    if [ $? -ne 0 ]; then
        log "Error: Falló la transferencia del backup al host remoto."
        exit 1
    fi
    log "Backup transferido correctamente al host remoto."
}

# Limpieza de backups antiguos (opcional)
clean_old_backups() {
    log "Eliminando backups antiguos locales..."
    # Limpiar backups locales más antiguos (opcional, mantiene solo 7 días)
    find "${BACKUP_DIR}" -type f -mtime +7 ! -name "*.log" -exec rm -f {} \;
    log " ---> Limpieza completada de backups antiguos."
}

# Función para verificar espacio disponible en el servidor local
check_local_space() {
    log "Verificando espacio disponible en el servidor local..."
    local local_space=""
    
    # Obtener el espacio disponible en el directorio de backups
    local_space=$(df -h "${BACKUP_DIR}" | awk 'NR==2 {print $4}')
    
    if [[ -z "${local_space}" ]]; then
        log "Error: No se pudo verificar el espacio disponible en el servidor local."
        # Si no se puede obtener el espacio, dar una advertencia pero continuar
        log "ADVERTENCIA: Continuando con la generación del backup, pero se recomienda verificar manualmente el espacio disponible."
        return 0
    fi
    
    log "Espacio disponible en el servidor local: ${local_space}"
    
    # Verificar si hay suficiente espacio (por ejemplo, al menos 10GB)
    local required_space=10  # Espacio requerido en GB
    local available_space=$(echo ${local_space} | sed 's/G//')

    if (( available_space < required_space )); then
        log "Error: No hay suficiente espacio en el servidor local para realizar el backup."
        exit 1
    fi
}


# Ejecución del script
log "***** Proceso de Backup Iniciado *****"
start_time=$(date +%s)
check_dependencies
check_local_space
generate_backup
transfer_backup
# clean_old_backups # Limpieza de backups antiguos (opcional)
end_time=$(date +%s)
elapsed_time=$((end_time - start_time))
minutes=$((elapsed_time / 60))
seconds=$((elapsed_time % 60))
log "Tiempo total de ejecución del script: ${minutes} minutos y ${seconds} segundos"
log "***** Proceso de Backup Finalizado Exitosamente *****"
exit 0