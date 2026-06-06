# GLPI - Helpdesk et Gestion des Tickets

## Introduction

Le Helpdesk centralise toutes les demandes utilisateurs.

---

# Types de tickets

## Incident

Panne ou dysfonctionnement.

Exemple :

```text
Imprimante hors service
```

## Demande

Besoin utilisateur.

Exemple :

```text
Création d'un compte utilisateur
```

---

# Cycle de vie

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

# Priorités

| Niveau     | Description    |
| ---------- | -------------- |
| Très basse | Non urgent     |
| Basse      | Faible impact  |
| Moyenne    | Standard       |
| Haute      | Important      |
| Critique   | Service bloqué |

---

# Affectation

Par :

* Utilisateur
* Groupe
* Technicien

---

# SLA

Définition :

Service Level Agreement

Exemple :

```text
Critique : 2h
Haute : 4h
Moyenne : 8h
```

---

# Notifications

Envoi automatique :

* Création
* Attribution
* Résolution

---

# Validation

Certains tickets nécessitent :

* Validation hiérarchique
* Validation informatique

---

# Suivi

Historique complet :

* Commentaires
* Temps passé
* Changements de statut

---

# Base de connaissances

Création d'articles à partir des incidents récurrents.

---

# Rapports

* Temps moyen de résolution
* Tickets par service
* Charge techniciens

