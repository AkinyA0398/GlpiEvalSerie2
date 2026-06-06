# GLPI - Administration Complète

# Introduction

L'administration GLPI consiste à :

* Gérer les utilisateurs
* Gérer les permissions
* Superviser le parc
* Assurer la sécurité
* Maintenir la plateforme

---

# Gestion des utilisateurs

Menu :

```text
Administration
→ Utilisateurs
```

Informations :

* Login
* Nom
* Email
* Téléphone
* Entité

---

# Profils

Les profils déterminent les droits.

## Super-Admin

Accès total.

## Admin

Administration standard.

## Technicien

Gestion des tickets.

## Self-Service

Création de tickets.

## Observateur

Lecture seule.

---

# Groupes

Utilisation :

* Affectation automatique
* Gestion des équipes
* Permissions

Exemple :

```text
Support Niveau 1
Support Niveau 2
Infrastructure
Réseau
```

---

# Entités

Organisation hiérarchique.

Exemple :

```text
Entreprise
│
├── Direction
├── RH
├── Informatique
└── Production
```

---

# Gestion des droits

Types :

* Lecture
* Création
* Mise à jour
* Suppression

Principe :

```text
Profil
+
Entité
=
Permissions
```

---

# Journaux

Consultation :

```text
Administration
→ Journaux
```

Permet :

* Audit
* Sécurité
* Traçabilité

---

# Notifications

Email automatique :

* Création ticket
* Affectation
* Résolution
* Validation

---

# Tâches automatiques

Menu :

```text
Configuration
→ Actions automatiques
```

Exemples :

* Nettoyage sessions
* Notifications
* Inventaire

---

# Gestion des plugins

Menu :

```text
Configuration
→ Plugins
```

Plugins populaires :

* GLPI Inventory
* Formcreator
* Data Injection
* Fields

---

# Sécurité

Recommandations :

## Comptes

* Mots de passe forts
* MFA si possible

## Serveur

* HTTPS
* Pare-feu
* Sauvegardes

## Base de données

Limiter :

```sql
GRANT ALL ON glpi.*
TO 'glpi'@'localhost';
```

Éviter :

```sql
GRANT ALL ON *.*
```

---

# Surveillance

Contrôler :

* Espace disque
* Logs Apache
* Logs PHP
* Logs MariaDB

Exemple :

```bash
tail -f /var/log/apache2/error.log
```

---

# Sauvegardes

## Base

```bash
mysqldump -u root -p glpi > backup.sql
```

## Fichiers

```bash
tar czvf backup_glpi.tar.gz /var/www/html/glpi
```

---

# Restauration

Base :

```bash
mysql -u root -p glpi < backup.sql
```

Fichiers :

```bash
tar xzvf backup_glpi.tar.gz
```

---

# Administration quotidienne

À vérifier :

* Tickets ouverts
* Notifications
* Sauvegardes
* Actions automatiques
* Inventaires

---

# Compétences d'un administrateur GLPI

Doit maîtriser :

* Linux
* Apache
* PHP
* MariaDB
* Réseau
* Sauvegardes
* Sécurité
* API REST
