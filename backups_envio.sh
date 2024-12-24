#!/bin/bash
###########################################################
## Script para realizar transferencia de backup de Oracle ##
## FXGS                                                 ##
###########################################################


# Variables del backup
BACKUP_DIR="/backups/oracle/temp"               # Directorio local para backups
LOCAL_USER="root"                               # Usuario local
LOCAL_PASSWORD="admin.prueba/2015*"                  # Contraseña local
LOCAL_HOST="192.168.120.13"                          # IP del servidor local
SH_DIR="/home/sis_backups_auto/backups_centu5.sh"                                       # Directorio de scripts


REMOTE_USER="root"                               # Usuario remoto
REMOTE_PASSWORD="alcaldiA2025P"                  # Contraseña para ssh
REMOTE_HOST="159.223.186.132"                    # IP del servidor remoto
REMOTE_PATH="/var/backups/back_cabildo"          # Ruta remota
TIMEOUT="30"                                     # Tiempo de espera para el comando SCP

DATE=$(date +'%Y%m%d-%H%M%S')                     # Fecha actual para nombres únicos
BACKUP_NAME="expsisesmer_${DATE}.dmp"            # Nombre del archivo de backup
BACKUP_FILE="${BACKUP_NAME}.gz"                  # Nombre del archivo comprimido
LOG_FILE="${BACKUP_DIR}/backup_${DATE}.log"      # Archivo de log

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
    for cmd in scp sshpass; do
        if ! command -v "$cmd" &>/dev/null; then
            log "Error: $cmd no está instalado."
            read -p "¿Deseas instalar $cmd? (s/n): " choice
            if [[ "$choice" == "s" || "$choice" == "S" ]]; then
                case $cmd in                 
                    scp | ssh) yum install -y openssh-clients;;
                    *) log "Comando desconocido: $cmd"; exit 1;;
                esac
            else
                log "Por favor instala $cmd manualmente."
                exit 1
            fi
        fi
    done
    log "Todas las dependencias están presentes."
}

# Función para generar el backup de Oracle
generate_backup() {
    log "Iniciando el proceso de backup en el servidor local... ${BACKUP_NAME}"
    
    # Construir el comando completo
    local comando="sshpass -p \"${LOCAL_PASSWORD}\" ssh -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 ${LOCAL_USER}@${LOCAL_HOST} \"bash ${SH_DIR} ${BACKUP_NAME}\""
    
    # Loguear el comando completo
    log "COMANDO A USAR: ${comando}"
    
    # Ejecutar el comando
    eval "${comando}"
    
    if [ $? -ne 0 ]; then
        log "Error: Falló la ejecución del script de backup en el servidor local."
        exit 1
    fi
    log "Backup generado correctamente en el servidor local."
}


# Verificar espacio disponible en el servidor remoto usando SSH
check_remote_space() {
    log "Verificando espacio disponible en el servidor remoto..."
    local remote_space=""

    # Usar SSH para verificar el espacio disponible en el servidor remoto
    remote_space=$(sshpass -p "${REMOTE_PASSWORD}" ssh -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 "${REMOTE_USER}@${REMOTE_HOST}" 'df -h /' | grep -E '^/dev' | awk '{print $4}')

    if [[ -z "${remote_space}" ]]; then
        log "ADVERTENCIA: No se pudo verificar el espacio en el servidor remoto."
        log "Continuando con la transferencia, pero se recomienda verificar manualmente el espacio disponible."
        return 0  # Continuar con la ejecución
    fi

    log "Espacio disponible en el servidor remoto: ${remote_space}"
    return 0
}

# Función para transferir el backup desde CentOS 5 al servidor Ubuntu
transfer_interno_backup() {
    log "Iniciando descarga del backup desde el servidor CentOS 5..."
    
    # Construir el comando SCP
    local comando="scp -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 ${REMOTE_USER}@${LOCAL_HOST}:${BACKUP_DIR}/${BACKUP_FILE} ${BACKUP_DIR}/"
    
    # Loguear el comando completo
    log "Comando a ejecutar: ${comando}"
    
    # Ejecutar el comando
    eval "${comando}"
    
    if [ $? -ne 0 ]; then
        log "Error: Falló la descarga del backup desde el servidor CentOS 5."
        exit 1
    fi
    
    log "Backup descargado correctamente desde el servidor CentOS 5."
}

# Función para transferir el backup a otro servidor
transfer_backup() {
    log "Iniciando transferencia del backup al host remoto..."

    # Verificar el espacio remoto antes de la transferencia
    check_remote_space

    # Construir el comando completo
    local comando= "sshpass -p "${LOCAL_PASSWORD}" scp -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 "${BACKUP_DIR}/${BACKUP_FILE}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}""

     # Loguear el comando completo
    log "COMANDO A USAR PARA TRANSFERENCIA: ${comando}"
    
    # Ejecutar el comando
    eval "${comando}"
    
    if [ $? -ne 0 ]; then
        log "Error: Falló la transferencia del backup al host remoto."
        exit 1
    fi
    log "Backup transferido correctamente al host remoto."
}


# Ejecución del script
log "***** Proceso de Backup Iniciado *****"
start_time=$(date +%s)
check_dependencies
check_local_space
generate_backup
transfer_interno_backup
# clean_old_backups # Limpieza de backups antiguos (opcional)
end_time=$(date +%s)
elapsed_time=$((end_time - start_time))
minutes=$((elapsed_time / 60))
seconds=$((elapsed_time % 60))
log "Tiempo total de ejecución del script: ${minutes} minutos y ${seconds} segundos"
log "***** Proceso de Backup Finalizado Exitosamente *****"
exit 0
