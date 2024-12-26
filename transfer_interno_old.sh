#!/usr/bin/expect -f

# Variables
set timeout -1
set password "admin.prueba/2015*"
set remote_user "root"
set remote_host "192.168.120.13"
set remote_file "/backups/oracle/temp/expsisesmer_20241224-150334.dmp.gz"
set local_path "/backups/oracle/temp"

# Iniciar la transferencia SCP
spawn scp -oHostKeyAlgorithms=+ssh-rsa -oKexAlgorithms=+diffie-hellman-group14-sha1 $remote_user@$remote_host:$remote_file $local_path

# Manejar el prompt de contraseña
expect {
    "assword:" {
        send "$password\r"
        exp_continue
    }
    timeout {
        puts "Error: El comando SCP ha superado el tiempo límite."
        exit 1
    }
    eof {
        puts "Transferencia completada con éxito."
    }
}