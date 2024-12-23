#!/bin/bash
###########################################################
## Script para realizar backup Oracle                    ##
## ver 1.1                                               ##
## FXGS                                                  ##
###########################################################
# Fue Modificado porque el server local estaba sin espacio

# Variables de transacciones
XFOLDER_TEMP="/backups/oracle/temp"
XBACKUP="/backups/oracle/freenas"
XDIA=`date +'%Y%m%d-%H%M'`
XDIA_BACKUP=$XBACKUP/$XDIA
XDIA_F=`date +'%d-%m-%Y %H%M'`
echo "***Proceso de Backup iniciado: " $D_DIA_F

# Creo una unidad logica capturando una carpeta compartida que se encuentra en el server FREENAS
#mount -t cifs //192.168.120.19/BackUp-BdD-Informacion/Oracle -o username=NFSDiskVMs,password=nfs/2015* /backups/oracle/freenas
umount 192.168.120.19:/mnt/FileServer03/ESXi-VirtualDisk-Compartido
mount -v -t nfs -o vers=3 192.168.120.19:/mnt/FileServer03/ESXi-VirtualDisk-Compartido /backups/oracle/freenas


##Creamos el directorio para realizar el backup
mkdir $XDIA_BACKUP
echo "  -> Carpeta creada..."
chmod 777 $XDIA_BACKUP
echo "  -> Generando backup..."


##Seteamos variables de Entorno
export ORACLE_SID=bdesme
export ORACLE_HOME=/u01/app/oracle/product/10.2.0/db_1
export PATH=$PATH:$ORACLE_HOME/bin


##Lanzamos exportacion de ORACLE
echo " ---> Generando BackUp..."
exp sisesmer/294A315LS1S file=$XDIA_BACKUP/expsisesmer_$XDIA.dmp grants=n full=y


##Comprimimos el archivo generado
echo ""
echo "  -> Comprimiendo Respaldo..."
echo $XDIA_BACKUP/expsisesmer_$XDIA.dmp
gzip -8 $XDIA_BACKUP/expsisesmer_$XDIA.dmp
echo "  ---> Backup Generado y Compreso en server de destino - FreeNAS"
echo ""
echo "      :) ;) ;) :)"

# Desmonto unidad logica
#umount -t cifs //192.168.120.19/BackUp-BdD-Informacion/Oracle
