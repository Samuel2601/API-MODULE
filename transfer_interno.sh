#!/usr/bin/expect -f

# Argumentos pasados al script
set BACKUP_FILE [lindex $argv 0]
set BACKUP_DIR "/backups/oracle/temp"          
set LOCAL_USER "root"                         
set LOCAL_PASSWORD "admin.prueba/2015*"       
set LOCAL_HOST "192.168.120.13"                
set timeout -1                                
set LOCAL_PATH "/backups/oracle/temp"          

# Verificar que el archivo de backup está definido
if {![info exists BACKUP_FILE] || $BACKUP_FILE == ""} {
    puts "Error: No se especificó un archivo de backup."
    exit 1
}

# Registrar mensajes (función de log)
proc log {message} {
    puts "[exec date +%Y-%m-%d\ %H:%M:%S] - $message"
}

# Descargar el backup desde el servidor CentOS 5 con reintentos
log "Iniciando descarga del backup desde el servidor CentOS 5..."

# Construir la ruta completa del archivo remoto
set REMOTE_FILE "${BACKUP_DIR}/${BACKUP_FILE}"
set MAX_RETRIES 5
set retry 0

while {$retry < $MAX_RETRIES} {
    log "Intento [expr $retry + 1] de $MAX_RETRIES..."
    #construir el comando completo
    set comando "scp -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 $LOCAL_USER@$LOCAL_HOST:$REMOTE_FILE $LOCAL_PATH"
    log "Comando a ejecutar: ${comando}"
    # Ejecutar el comando
    spawn scp -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 $LOCAL_USER@$LOCAL_HOST:$REMOTE_FILE $LOCAL_PATH
    #scp -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 $LOCAL_USER@$LOCAL_HOST:$REMOTE_FILE $LOCAL_PATH
    expect {
        "assword:" {
            send "$LOCAL_PASSWORD\r"
            exp_continue
        }
        timeout {
            log "Advertencia: Tiempo de espera excedido. Reintentando..."
            incr retry
            continue
        }
        eof {
            log "Transferencia completada con éxito."
            break
        }
    }
}

if {$retry == $MAX_RETRIES} {
    log "Error: La transferencia falló después de $MAX_RETRIES intentos."
    exit 1
}

log "Backup descargado correctamente desde el servidor CentOS 5."
