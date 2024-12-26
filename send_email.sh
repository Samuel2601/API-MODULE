#!/bin/bash

# Parámetros
MACHINE_NAME=$1
DATE=$2
MINUTES=$3
SECONDS=$4
LOG_FILE=$5
TEMPLATE_PATH="/home/backups_auto/template.html"

# Verificar argumentos
if [ -z "$LOG_FILE" ] || [ ! -f "$LOG_FILE" ]; then
    echo "Error: Archivo de log no encontrado"
    exit 1
fi

# Configuración correo
RECIPIENT="saamare99@gmail.com"
SUBJECT="Resultado del Backup de Oracle"
SENDER="aplicaciones@esmeraldas.gob.ec"

# Determinar estado
if grep -qi "error\|failed\|failure" "$LOG_FILE"; then
    STATUS="❌ Con Errores"
else
    STATUS="✅ Exitoso"
fi

# Escapar contenido del log para sed
LOG_CONTENT=$(cat "$LOG_FILE" | sed ':a;N;$!ba;s/\n/\\n/g' | sed 's/[&/\]/\\&/g')
# Convertir timestamp a formato legible
FORMATTED_DATE=$(date -d "@$DATE" "+%d-%m-%Y %H:%M:%S")

# Leer y reemplazar variables en template
EMAIL_CONTENT=$(cat "$TEMPLATE_PATH" | sed \
    -e "s|{{MACHINE_NAME}}|${MACHINE_NAME}|g" \
    -e "s|{{DATE}}|${FORMATTED_DATE}|g" \
    -e "s|{{MINUTES}}|${MINUTES}|g" \
    -e "s|{{SECONDS}}|${SECONDS}|g" \
    -e "s|{{STATUS}}|${STATUS}|g" \
    -e "s|{{LOG_CONTENT}}|${LOG_CONTENT}|g")

# Configurar msmtp
cat > ~/.msmtprc <<EOL
defaults
auth on
tls on
tls_trust_file /etc/ssl/certs/ca-certificates.crt
logfile ~/.msmtp.log

account default
host mail.esmeraldas.gob.ec
port 465
from aplicaciones@esmeraldas.gob.ec
user aplicaciones@esmeraldas.gob.ec
password "Alcaldia2024/*"
tls_starttls off
EOL

chmod 600 ~/.msmtprc

# Enviar correo (corregido el comando msmtp)
echo -e "Subject: $SUBJECT\nContent-Type: text/html\n\n$EMAIL_CONTENT" | msmtp -t "$RECIPIENT"

exit 0