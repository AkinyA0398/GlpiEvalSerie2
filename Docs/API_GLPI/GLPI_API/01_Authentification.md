# 01 – Authentification

## Vue d'ensemble

Toute interaction avec l'API GLPI nécessite une session active. Deux méthodes d'authentification sont disponibles :

1. **user_token** (token personnel de l'utilisateur)
2. **login / password** (identifiants GLPI)

L'`App-Token` (token d'application) est **toujours requis** en plus de l'authentification utilisateur.

---

## Initialiser une session

### Via user_token

```http
GET glpi.localhost/glpi/apirest.php/initSession
Authorization: user_token <USER_TOKEN>
App-Token: <APP_TOKEN>
```

### Via login / mot de passe

```http
GET glpi.localhost/glpi/apirest.php/initSession
Authorization: Basic <base64(login:password)>
App-Token: <APP_TOKEN>
```

### Réponse

```json
{
  "session_token": "abc123xyz..."
}
```

> Conservez ce `session_token` : il doit être transmis dans **tous** les appels suivants.

---

## Utiliser le session_token

Ajoutez l'en-tête `Session-Token` à chaque requête :

```http
GET glpi.localhost/glpi/apirest.php/Ticket/1
Session-Token: abc123xyz...
App-Token: <APP_TOKEN>
```

---

## Changer l'entité active

```http
GET glpi.localhost/glpi/apirest.php/changeActiveEntities
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "entities_id": 3,
  "is_recursive": true
}
```

---

## Changer le profil actif

```http
GET glpi.localhost/glpi/apirest.php/changeActiveProfile
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
Content-Type: application/json

{
  "profiles_id": 2
}
```

---

## Obtenir la session courante

```http
GET glpi.localhost/glpi/apirest.php/getMyProfiles
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
GET glpi.localhost/glpi/apirest.php/getActiveProfile
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
GET glpi.localhost/glpi/apirest.php/getMyEntities
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

```http
GET glpi.localhost/glpi/apirest.php/getActiveEntities
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Informations sur l'utilisateur connecté

```http
GET glpi.localhost/glpi/apirest.php/getFullSession
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Clore la session (killSession)

```http
GET glpi.localhost/glpi/apirest.php/killSession
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

Réponse : `true`

---

## Récupérer un token API (user_token)

Via l'interface GLPI : **Mon compte → Accès API → Régénérer**

Ou via l'API (admin uniquement) :

```http
GET glpi.localhost/glpi/apirest.php/User/<id>?field[]=api_token
Session-Token: <SESSION_TOKEN>
App-Token: <APP_TOKEN>
```

---

## Bonnes pratiques

- Ne jamais exposer `SESSION_TOKEN` ou `APP_TOKEN` dans le code source.
- Appeler `killSession` à la fin de chaque script.
- Utiliser des variables d'environnement pour stocker les tokens.
