# Sujet à Venir : Implémentation de l'Authentification JWT (JSON Web Tokens)

## Contexte
Actuellement, l'application sécurise l'accès au BackOffice via une simple vérification de clé dans le `localStorage` (`adminSession`). Pour une application en production, il est critique d'utiliser un système de session sécurisé avec des jetons JWT gérés par le backend Flask.

## Fichiers à Modifier

### 1. Backend Python (`MyApi/app.py`)
- **Action** : Ajouter la librairie `PyJWT` et créer des endpoints de login.
- **Code Clé** :
```python
import jwt
import datetime
from functools import wraps
from flask import request, jsonify

SECRET_KEY = "votre_cle_secrete_tres_complexe"

# Décorateur pour protéger les routes
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token manquant!'}), 403
        try:
            # Récupérer le token après le "Bearer "
            data = jwt.decode(token.split(" ")[1], SECRET_KEY, algorithms=["HS256"])
        except:
            return jsonify({'message': 'Token invalide!'}), 403
        return f(*args, **kwargs)
    return decorated

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    # Vérification fictive (à relier à une DB)
    if data['username'] == 'admin' and data['password'] == 'password123':
        token = jwt.encode({
            'user': data['username'], 
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, SECRET_KEY, algorithm="HS256")
        return jsonify({'token': token})
    return jsonify({'message': 'Identifiants invalides'}), 401
```

### 2. Frontend React (`src/api/configApi.js` & `src/api/apiGlpi.js`)
- **Action** : Intercepter les requêtes pour injecter le token JWT dans les headers `Authorization`.
- **Code Clé** :
```javascript
export const apiLocalStatus = async (endpoint, options = {}) => {
  const url = `${BASE_URL}/${endpoint}`;
  const token = localStorage.getItem('jwt_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    // Rediriger vers la page de connexion si le token a expiré ou est invalide
    localStorage.removeItem('jwt_token');
    window.location.href = '/login';
    throw new Error('Session expirée');
  }
  
  return await response.json();
};
```

### 3. Frontend React (`src/components/LoginBack.jsx`)
- **Action** : Appeler l'API de login et stocker le token cryptographique au lieu d'une simple chaîne statique.
- **Code Clé** :
```javascript
const handleLogin = async (e) => {
  e.preventDefault();
  
  try {
    const res = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('jwt_token', data.token);
      navigate('/admin/dashboard');
    } else {
      setError('Identifiants incorrects');
    }
  } catch (err) {
    setError('Erreur de connexion au serveur');
  }
};
```
