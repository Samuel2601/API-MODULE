#!/bin/bash
###########################################################
## Script para realizar backup de Oracle ##
## FXGS                                                 ##
###########################################################

# Variables de entorno
export ORACLE_SID=bdesme
export ORACLE_HOME=/u01/app/oracle/product/10.2.0/db_1
export PATH=$PATH:$ORACLE_HOME/bin

# Variables del backup
BACKUP_DIR="/backups/oracle/temp"               # Directorio local para backups
USER="sisesmer"                                 # Usuario de Oracle
PASSWORD="sisesmer"                             # Contraseña de Oracle
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
    for cmd in exp gzip scp ssh ; do
        if ! command -v "$cmd" &>/dev/null; then
            log "Error: $cmd no está instalado."
            read -p "¿Deseas instalar $cmd? (s/n): " choice
            if [[ "$choice" == "s" || "$choice" == "S" ]]; then
                case $cmd in
                    exp) log "Instalar manualmente el cliente de Oracle."; exit 1;;
                    gzip) yum install -y gzip;;
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
    local start_time=$(date +%s)
    log "Iniciando generación del backup para Oracle..."
    exp "${USER}/${PASSWORD}" file="${BACKUP_DIR}/${BACKUP_NAME}" grants=n full=y

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

    # Obtener el espacio disponible en el directorio de backups
    local_space=$(df -P "${BACKUP_DIR}" | tail -1 | awk '{print $4}')
    
    if [[ -z "${local_space}" ]]; then
        log "Error: No se pudo verificar el espacio disponible en el servidor local."
        log "ADVERTENCIA: Continuando con la generación del backup, pero se recomienda verificar manualmente el espacio disponible."
        return 0
    fi

    # Convertir espacio disponible a GB (df -P reporta bloques de 1KB)
    local_space_gb=$((local_space / 1024 / 1024))
    log "Espacio disponible en el servidor local: ${local_space_gb} GB"
    
    # Verificar si hay suficiente espacio (por ejemplo, al menos 10GB)
    local required_space=3  # Espacio requerido en GB

    if (( local_space_gb < required_space )); then
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
# clean_old_backups # Limpieza de backups antiguos (opcional)
end_time=$(date +%s)
elapsed_time=$((end_time - start_time))
minutes=$((elapsed_time / 60))
seconds=$((elapsed_time % 60))
log "Tiempo total de ejecución del script: ${minutes} minutos y ${seconds} segundos"
log "***** Proceso de Backup Finalizado Exitosamente *****"
exit 0
