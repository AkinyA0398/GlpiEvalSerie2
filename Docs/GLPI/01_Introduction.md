# GLPI - Fondamentaux et Concepts Essentiels

## Introduction

GLPI (Gestionnaire Libre de Parc Informatique) est une solution open source permettant de gérer :

* Le parc informatique
* Les utilisateurs
* Les tickets d'assistance
* Les contrats
* Les fournisseurs
* Les licences logicielles
* Les inventaires automatiques

GLPI est utilisé par les services informatiques pour centraliser la gestion des ressources et du support technique.

---

# Architecture Générale

```text
Utilisateurs
      │
      ▼
  Helpdesk
      │
      ▼
   Tickets
      │
      ▼
Techniciens
      │
      ▼
 Résolution
```

Parallèlement :

```text
Inventaire
    │
    ▼
Ordinateurs
Imprimantes
Serveurs
Réseaux
Logiciels
```

---

# Compétences nécessaires pour utiliser GLPI

## Systèmes d'exploitation

Connaître :

* Linux
* Windows

Exemples :

* Gestion des services
* Gestion des fichiers
* Permissions

---

## Serveurs Web

Connaître :

* Apache
* Nginx
* PHP

Exemple :

```bash
sudo systemctl start apache2
sudo systemctl restart apache2
```

---

## Bases de données

GLPI utilise principalement :

* MariaDB
* MySQL

Connaissances recommandées :

```sql
SHOW DATABASES;
SHOW TABLES;

SELECT * FROM glpi_users;
SELECT * FROM glpi_tickets;
```

---

## Réseau

Notions importantes :

* Adresse IP
* DHCP
* DNS
* VLAN
* Routeurs
* Switchs

---

# Les composants les plus importants de GLPI

## 1. Tickets

Le cœur de GLPI.

Un ticket représente :

* Une panne
* Une demande
* Une intervention

Cycle :

```text
Nouveau
↓
Attribué
↓
En cours
↓
Résolu
↓
Clos
```

---

## 2. Utilisateurs

Chaque utilisateur possède :

* Un identifiant
* Un email
* Un profil
* Une entité

---

## 3. Profils

Les profils déterminent les permissions.

Exemples :

| Profil       | Description      |
| ------------ | ---------------- |
| Super-Admin  | Contrôle total   |
| Admin        | Administration   |
| Technicien   | Gestion tickets  |
| Self-Service | Création tickets |
| Observateur  | Lecture seule    |

---

## 4. Groupes

Permettent de regrouper les utilisateurs.

Exemples :

```text
Support
Réseau
Système
Développement
```

---

## 5. Entités

Permettent la séparation logique des données.

Exemple :

```text
Entreprise
│
├── Informatique
├── RH
├── Comptabilité
└── Direction
```

---

## 6. Inventaire

GLPI peut gérer :

* Ordinateurs
* Serveurs
* Imprimantes
* Moniteurs
* Réseaux
* Logiciels

---

## 7. Base de connaissances

Permet de stocker :

* Tutoriels
* Procédures
* Solutions

Exemple :

```text
Comment réinitialiser un mot de passe
```

---

# Les entités les plus importantes

## Entité Racine

Entité principale.

Exemple :

```text
Entreprise
```

---

## Sous-entités

Exemple :

```text
Entreprise
├── Informatique
├── RH
├── Comptabilité
└── Production
```

---

## Pourquoi utiliser les entités ?

Elles permettent :

* La séparation des données
* La délégation d'administration
* La gestion multi-sites
* La gestion multi-sociétés

---

# Les objets les plus utilisés dans GLPI

## Ordinateurs

Informations :

* Nom
* RAM
* CPU
* Disque
* Adresse IP

---

## Utilisateurs

Informations :

* Login
* Email
* Téléphone
* Entité

---

## Tickets

Informations :

* Demandeur
* Priorité
* Statut
* Technicien

---

## Imprimantes

Informations :

* Adresse IP
* Emplacement
* Modèle

---

## Logiciels

Informations :

* Nom
* Version
* Éditeur

---

## Licences

Informations :

* Nombre acheté
* Nombre utilisé
* Expiration

---

## Contrats

Informations :

* Fournisseur
* Date de début
* Date de fin

---

# GLPI Agent

Le GLPI Agent permet :

* L'inventaire automatique
* La remontée des logiciels
* La découverte réseau

Il est indispensable dans les infrastructures professionnelles.

---

# Parcours d'apprentissage recommandé

## Niveau Débutant

* Installation GLPI
* Création utilisateurs
* Gestion tickets
* Inventaire manuel

## Niveau Intermédiaire

* Entités
* Profils
* Groupes
* Notifications Email
* GLPI Agent

## Niveau Avancé

* API REST
* Plugins
* Automatisation
* Sauvegardes
* Optimisation SQL

---

# Résumé

Les 7 notions à maîtriser absolument :

1. Entités
2. Profils
3. Utilisateurs
4. Groupes
5. Tickets
6. Inventaire
7. GLPI Agent

Ces éléments représentent plus de 80 % de l'utilisation quotidienne de GLPI en entreprise.
