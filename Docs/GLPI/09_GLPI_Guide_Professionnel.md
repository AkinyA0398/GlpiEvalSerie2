# GLPI - Guide Professionnel

## Objectif

Mettre en œuvre une plateforme ITSM professionnelle basée sur GLPI.

---

# Architecture recommandée

```text
Utilisateurs
      ↓
Reverse Proxy
      ↓
Apache/Nginx
      ↓
GLPI
      ↓
MariaDB
```

---

# Sécurité

## HTTPS obligatoire

Utiliser :

* Let's Encrypt
* Certificats d'entreprise

---

# Sauvegardes

## Quotidiennes

* Base de données
* Documents
* Configuration

## Hebdomadaires

* Sauvegarde complète

---

# Haute disponibilité

Possibilités :

* Réplication MariaDB
* Serveurs multiples
* Répartition de charge

---

# Supervision

Outils :

* Zabbix
* Nagios
* Centreon

---

# Plugins recommandés

## GLPI Inventory

Inventaire automatisé.

## Formcreator

Formulaires avancés.

## Data Injection

Import de données.

## Fields

Champs personnalisés.

---

# Gouvernance IT

GLPI peut couvrir :

* ITIL Incident Management
* Request Management
* Asset Management
* Change Management

---

# Audit

Contrôler :

* Permissions
* Comptes inactifs
* Contrats expirés
* Équipements obsolètes

---

# Compétences Administrateur GLPI

Maîtriser :

* Linux
* Apache
* PHP
* MariaDB
* Réseau
* Sécurité
* API REST
* Sauvegarde
* Supervision

---

# Compétences Expert GLPI

Maîtriser en plus :

* Automatisation
* Développement plugins
* Intégration LDAP
* API avancée
* Architecture haute disponibilité
* Optimisation SQL

---

# Conclusion

Un administrateur GLPI performant doit être capable de :

1. Installer et sécuriser la plateforme.
2. Gérer le parc informatique.
3. Administrer les utilisateurs.
4. Exploiter l'API REST.
5. Superviser les sauvegardes.
6. Produire des rapports.
7. Automatiser les tâches répétitives.
