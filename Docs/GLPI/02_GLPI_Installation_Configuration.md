# GLPI - Installation et Configuration Complète

## Introduction

L'installation de GLPI repose sur une architecture Web classique :

```text
Client Web
    │
    ▼
Apache / Nginx
    │
    ▼
PHP
    │
    ▼
MariaDB / MySQL
```

---

# Prérequis

## Matériel

### Minimum

* CPU : 2 cœurs
* RAM : 4 Go
* Stockage : 20 Go

### Recommandé

* CPU : 4 cœurs ou plus
* RAM : 8 Go ou plus
* SSD
* Sauvegarde dédiée

---

# Système d'exploitation

GLPI fonctionne sur :

## Linux

* Debian
* Ubuntu
* Kali Linux
* Rocky Linux
* AlmaLinux
* CentOS

## Windows

* Windows Server

Linux est fortement recommandé.

---

# Installation Apache

## Debian / Ubuntu

```bash
sudo apt update
sudo apt install apache2
```

Vérification :

```bash
sudo systemctl status apache2
```

Démarrage :

```bash
sudo systemctl start apache2
```

Activation au démarrage :

```bash
sudo systemctl enable apache2
```

---

# Installation MariaDB

```bash
sudo apt install mariadb-server
```

Démarrage :

```bash
sudo systemctl start mariadb
```

Sécurisation :

```bash
sudo mysql_secure_installation
```

---

# Installation PHP

Exemple :

```bash
sudo apt install php php-cli php-common php-curl php-gd php-intl php-mysql php-xml php-mbstring php-zip php-bz2 php-imap php-ldap php-apcu
```

Vérification :

```bash
php -v
```

---

# Création de la base GLPI

Connexion :

```bash
sudo mariadb
```

Création :

```sql
CREATE DATABASE glpi
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

CREATE USER 'glpi'@'localhost'
IDENTIFIED BY 'motdepasse';

GRANT ALL PRIVILEGES
ON glpi.*
TO 'glpi'@'localhost';

FLUSH PRIVILEGES;
```

---

# Déploiement de GLPI

Téléchargement :

```bash
wget https://github.com/glpi-project/glpi/releases/download/x.x.x/glpi-x.x.x.tgz
```

Extraction :

```bash
tar -xzf glpi-x.x.x.tgz
```

Déplacement :

```bash
sudo mv glpi /var/www/html/
```

Permissions :

```bash
sudo chown -R www-data:www-data /var/www/html/glpi
sudo chmod -R 755 /var/www/html/glpi
```

---

# Configuration Apache

Création du VirtualHost :

```apache
<VirtualHost *:80>
    ServerName glpi.local

    DocumentRoot /var/www/html/glpi/public

    <Directory /var/www/html/glpi/public>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Activation :

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

# Assistant d'installation

Accès :

```text
http://serveur/glpi
```

Étapes :

1. Choix de langue
2. Acceptation licence
3. Vérification prérequis
4. Connexion MariaDB
5. Initialisation base
6. Création comptes

---

# Comptes par défaut

```text
glpi/glpi
tech/tech
normal/normal
post-only/postonly
```

⚠️ À modifier immédiatement.

---

# Configuration Email

Menu :

```text
Configuration
→ Notifications
→ Configuration des notifications
```

Paramètres SMTP :

```text
smtp.gmail.com
Port 587
TLS
```

---

# Configuration HTTPS

Installation :

```bash
sudo apt install certbot python3-certbot-apache
```

Génération certificat :

```bash
sudo certbot --apache
```

---

# Sauvegarde

Base :

```bash
mysqldump -u root -p glpi > glpi.sql
```

Fichiers :

```bash
tar czvf glpi_files.tar.gz /var/www/html/glpi
```

---

# Mise à jour

Sauvegarder :

* base
* fichiers

Remplacer les sources :

```bash
tar xzf glpi_new.tgz
```

Lancer ensuite l'assistant de migration.

---

# Bonnes pratiques

* HTTPS obligatoire
* Sauvegardes quotidiennes
* Comptes par défaut supprimés
* Mises à jour régulières
* Surveillance des logs
