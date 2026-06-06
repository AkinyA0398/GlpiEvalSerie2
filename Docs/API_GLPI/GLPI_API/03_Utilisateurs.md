# 03 – Utilisateurs

## Vue d'ensemble

Gestion complète des comptes utilisateurs GLPI via l'API REST.

---

## Lister les utilisateurs

```http
GET glpi.localhost/glpi/apirest.php/User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

Avec filtre sur le nom :

```http
GET glpi.localhost/glpi/apirest.php/User?searchText[name]=dupont
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Lire un utilisateur

```http
GET glpi.localhost/glpi/apirest.php/User/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Réponse (extrait)

```json
{
  "id": 5,
  "name": "jdupont",
  "realname": "Dupont",
  "firstname": "Jean",
  "email": "jean.dupont@exemple.fr",
  "phone": "0600000001",
  "entities_id": 1,
  "profiles_id": 3,
  "is_active": 1,
  "date_mod": "2024-03-01 08:00:00"
}
```

---

## Créer un utilisateur

```http
POST glpi.localhost/glpi/apirest.php/User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "name": "mmartin",
    "realname": "Martin",
    "firstname": "Marie",
    "password": "MotDePasse123!",
    "password2": "MotDePasse123!",
    "email": "marie.martin@exemple.fr",
    "phone": "0600000002",
    "entities_id": 1,
    "profiles_id": 3,
    "is_active": 1
  }
}
```

---

## Modifier un utilisateur

```http
PUT glpi.localhost/glpi/apirest.php/User/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "phone": "0611223344",
    "is_active": 0
  }
}
```

---

## Supprimer un utilisateur

```http
DELETE glpi.localhost/glpi/apirest.php/User/<id>
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Emails d'un utilisateur

```http
GET glpi.localhost/glpi/apirest.php/User/<id>/UserEmail
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter un email

```http
POST glpi.localhost/glpi/apirest.php/UserEmail
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "users_id": 5,
    "email": "jean.dupont.pro@exemple.fr",
    "is_default": 0
  }
}
```

---

## Profils d'un utilisateur

```http
GET glpi.localhost/glpi/apirest.php/User/<id>/Profile_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Associer un profil à une entité

```http
POST glpi.localhost/glpi/apirest.php/Profile_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "users_id": 5,
    "profiles_id": 4,
    "entities_id": 2,
    "is_recursive": 1,
    "is_default": 0
  }
}
```

---

## Groupes d'un utilisateur

```http
GET glpi.localhost/glpi/apirest.php/User/<id>/Group_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

### Ajouter à un groupe

```http
POST glpi.localhost/glpi/apirest.php/Group_User
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "input": {
    "users_id": 5,
    "groups_id": 3
  }
}
```

---

## Chercher par login

```http
GET glpi.localhost/glpi/apirest.php/User?searchText[name]=mmartin&forcedisplay[0]=1&forcedisplay[1]=5&forcedisplay[2]=34
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

> `forcedisplay` permet de spécifier les champs retournés (IDs des champs GLPI).
