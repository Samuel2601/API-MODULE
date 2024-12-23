# Ejemplo
#!/bin/bash
###########################################################
## Script para realizar backup Oracle                    ##
## ver 1.1                                               ##
##                                                       ##
###########################################################

XFOLDER_TEMP="/backups/oracle/temp"
XBACKUP="/backups/oracle/freenas"
XDIA=`date +'%Y%m%d-%H%M'`
XDIA_BACKUP=$XBACKUP/$XDIA
XDIA_F=`date +'%d-%m-%Y %H%M'`

#umount 192.168.120.19:/mnt/FileServer03/ESXi-VirtualDisk-Compartido
#mount -v -t nfs -o vers=3 192.168.120.19:/mnt/FileServer03/ESXi-VirtualDisk-Compartido /backups/oracle/freenas

mkdir $XDIA_BACKUP
chmod 777 $XDIA_BACKUP

export ORACLE_SID=bdesme
export ORACLE_HOME=/u01/app/oracle/product/10.2.0/db_1
export PATH=$PATH:$ORACLE_HOME/bin

exp sisesmer/L10N3L6141 file=$XDIA_BACKUP/expsisesmer_$XDIA.dmp grants=n full=y

echo ""
echo "      Finalizado"
