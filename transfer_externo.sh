#!/usr/bin/expect -f

# Argumentos pasados al script
set BACKUP_FILE [lindex $argv 0] 
set REMOTE_USER "root"             
set REMOTE_PASSWORD "alcaldiA2025P"   
set REMOTE_HOST "159.223.186.132"     
set REMOTE_PATH "/var/backups/back_cabildo" 
set timeout -1                     
set LOCAL_PATH "/backups/oracle/temp"

# Construir la ruta completa del archivo remoto
set PATH_FILE "${LOCAL_PATH}/${BACKUP_FILE}"

# Verificar que el archivo de backup está definido
if {![info exists BACKUP_FILE] || $BACKUP_FILE == ""} {
    puts "Error: No se especificó un archivo de backup."
    exit 1
}

# Registrar mensajes (función de log)
proc log {message} {
    puts "[exec date +%Y-%m-%d\ %H:%M:%S] - $message"
}

# Verificar espacio disponible en el servidor remoto usando SSH
proc check_remote_space {} {
    global REMOTE_PASSWORD REMOTE_USER REMOTE_HOST

    log "Verificando espacio disponible en el servidor remoto..."
    
    if {[catch {
        set cmd "sshpass -p $REMOTE_PASSWORD ssh -oStrictHostKeyChecking=no -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 $REMOTE_USER@$REMOTE_HOST \"df -h / | grep -E '^/dev' | awk '{print \\\$4}'\""
        set remote_space [exec sh -c $cmd]
        log "Espacio disponible en el servidor remoto: $remote_space"
    } err]} {
        log "ADVERTENCIA: No se pudo verificar el espacio en el servidor remoto: $err"
        log "Continuando con la transferencia, pero se recomienda verificar manualmente el espacio disponible."
    }
}

# Función para transferir el backup a otro servidor
proc transfer_backup {} {
    global LOCAL_PATH BACKUP_FILE REMOTE_USER REMOTE_HOST REMOTE_PATH REMOTE_PASSWORD PATH_FILE
    
    log "Iniciando transferencia del backup al host remoto..."

    # Verificar el espacio remoto antes de la transferencia
    check_remote_space

    # Construir el comando completo
    set comando "scp $PATH_FILE $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH"

    # Loguear el comando completo
    log "COMANDO A USAR PARA TRANSFERENCIA: ${comando}"

    # Usar spawn para capturar el progreso
    spawn scp $PATH_FILE $REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH

    # Manejar la interacción con el comando scp
    expect {
        "assword:" {
            send "$REMOTE_PASSWORD\r"
            exp_continue
        }
        timeout {
            log "Advertencia: Tiempo de espera excedido."
            exit 1
        }
        eof {
            log "Transferencia completada con éxito."
        }
    }
}

# Llamada a la función principal
transfer_backup
