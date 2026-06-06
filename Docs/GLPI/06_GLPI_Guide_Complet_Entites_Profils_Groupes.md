# Entités, Profils et Groupes

## Entités

Les entités permettent de segmenter l'organisation.

Exemple :

```text
Entreprise
├── Informatique
├── RH
├── Production
└── Direction
```

---

# Héritage

L'entité parent peut voir les enfants.

L'enfant ne peut pas voir le parent.

---

# Profils

Définissent les permissions.

## Super-Admin

Contrôle total.

## Admin

Administration fonctionnelle.

## Technicien

Support et inventaire.

## Self-Service

Portail utilisateur.

---

# Groupes

Organisation des équipes.

Exemple :

```text
Support N1
Support N2
Infrastructure
Développement
```

---

# Association

```text
Utilisateur
   ↓
 Profil
   ↓
 Entité
   ↓
 Permissions
```

---

# Cas d'entreprise multi-sites

```text
Entreprise
├── Antananarivo
├── Toamasina
├── Mahajanga
└── Fianarantsoa
```

Chaque site possède :

* Utilisateurs
* Tickets
* Matériels

indépendants.
