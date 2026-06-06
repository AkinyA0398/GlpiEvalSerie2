# 07 – Profils

## Vue d'ensemble

Les profils définissent les droits d'accès des utilisateurs dans GLPI (lecture, écriture, suppression par itemtype).

---

## Lister les profils

```http
GET glpi.localhost/glpi/apirest.php/Profile
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un profil

```http
GET glpi.localhost/glpi/apirest.php/Profile/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 3,
  "name": "Technicien",
  "comment": "Profil technicien helpdesk",
  "interface": "central",
  "is_default": 0,
  "helpdesk_hardware": 1,
  "helpdesk_item_type": "['Computer','Printer','Monitor']",
  "date_mod": "2024-01-01 00:00:00"
}
```

### Interfaces

| Valeur | Description |
|--------|-------------|
| `central` | Interface complète GLPI |
| `helpdesk` | Interface simplifiée utilisateur final |

---

## Créer un profil

```http
POST glpi.localhost/glpi/apirest.php/Profile
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "Responsable SI",
    "interface": "central",
    "is_default": 0,
    "comment": "Accès complet lecture/écriture"
  }
}
```

---

## Modifier un profil

```http
PUT glpi.localhost/glpi/apirest.php/Profile/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "comment": "Profil mis à jour"
  }
}
```

---

## Profils de l'utilisateur courant

```http
GET glpi.localhost/glpi/apirest.php/getMyProfiles
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Profil actif de la session

```http
GET glpi.localhost/glpi/apirest.php/getActiveProfile
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Changer le profil actif

```http
POST glpi.localhost/glpi/apirest.php/changeActiveProfile
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "profiles_id": 4
}
```

---

## Utilisateurs d'un profil

```http
GET glpi.localhost/glpi/apirest.php/Profile_User?searchText[profiles_id]=3
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Notes importantes

- La gestion fine des **droits par itemtype** n'est pas exposée via REST de façon granulaire ; elle se configure dans l'interface GLPI.
- Un utilisateur peut avoir **plusieurs profils** associés à des entités différentes.
- Le profil `Super-Admin` (id=4 par défaut) donne tous les droits.
