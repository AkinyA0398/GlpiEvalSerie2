Documentation Technique : Application Backend & Gestion des Coûts (Cost / SuperCost)
Cette documentation décrit l'architecture, la base de données, les concepts métiers (notamment Cost, SuperCost et Réouverture) et les API exposées par l'application backend (MyApi/app.py).

1. Vue d'ensemble de l'Architecture
Le backend est développé en Python en utilisant le micro-framework Flask.

Base de données : SQLite (test.db), utilisée pour stocker des états personnalisés (status) et des coûts supplémentaires non gérés nativement par GLPI.
CORS : Géré via flask_cors pour permettre la communication avec l'application front-end React.
2. Modèle de Données (SQLite)
La base de données SQLite est initialisée automatiquement au démarrage (via init_db()) avec deux tables principales :

Table status
Gère les différents statuts des tickets (Nouveau, En cours, Résolu) avec une logique de traduction multi-langues.

id (INTEGER) : Clé primaire, correspond à l'ID du statut GLPI.
couleur (TEXT) : Code couleur (ex: #00d2ff).
name_fr (TEXT) : Nom en français.
name_en (TEXT) : Nom en anglais.
name_mg (TEXT) : Nom en malgache.
Table costItem
Table centrale pour la gestion des "SuperCosts" et coûts de réouverture.

id (INTEGER) : Clé primaire.
item_id (TEXT) : L'identifiant de l'équipement ou du type d'item associé.
cost (INT) : Représente le SuperCost (coût additionnel manuel lors de la résolution).
prix (INT) : Représente le Coût de Réouverture (souvent calculé en pourcentage du SuperCost côté front).
id_ticket (INT) : L'identifiant du ticket GLPI associé.
gp (TIMESTAMP) : Horodatage (utilisé pour identifier la dernière entrée d'un ticket).
3. Concepts Métiers : Cost, SuperCost et Réouverture
Dans le contexte de l'application (en croisant avec la logique Frontend) :

GLPI Cost (Coût GLPI) : C'est le coût natif calculé et stocké par GLPI. Le backend Flask n'intervient pas dans son stockage.
SuperCost (cost) : C'est un coût spécifique (manuel) saisi par l'utilisateur lorsqu'il déplace un ticket vers la colonne "Terminé". Il est enregistré dans la colonne cost de la table costItem.
Réouverture / CostPrix (prix) : Lorsqu'un ticket est rouvert, un coût supplémentaire (souvent un pourcentage du SuperCost) est appliqué. Il est stocké dans la colonne prix de la table costItem.
4. Documentation des APIs
Toutes les routes sont préfixées par la racine de l'URL du backend (ex: http://localhost:5000/).

4.1. Gestion des Coûts (SuperCost & Réouverture)
NOTE

Les données de coûts sont insérées via deux routes distinctes selon qu'il s'agit d'un "SuperCost" (/cost) ou d'un coût de réouverture (/costPrix).

POST /cost
Rôle : Ajouter un nouveau SuperCost lors de la résolution d'un ticket.

Payload attendu (JSON) :
json
{
  "item_id": "string",
  "cost": "int",
  "ticket_id": "int",
  "gp": "timestamp"
}
Réponse : 201 Created - {"message": "Cost added"}
POST /costPrix
Rôle : Ajouter un coût de Réouverture (stocké dans le champ prix).

Payload attendu (JSON) :
json
{
  "item_id": "string",
  "cost": "int", // Sera inséré dans la colonne `prix`
  "ticket_id": "int",
  "gp": "timestamp"
}
Réponse : 201 Created - {"message": "Prix added"}
DELETE /cost/<int:ticket_id>
Rôle : Supprimer la toute dernière entrée de coût associée à un ticket (identifiée via le timestamp gp le plus récent).

Réponse : 200 OK - {"message": "Last cost record deleted successfully"} (ou 404 si aucun historique trouvé).
GET /costLast
Rôle : Récupérer l'historique des SuperCosts pour un item et un ticket donnés (ordonnés du plus récent au plus ancien).

Query Params : ?itemtype=<string>&id_ticket=<int>
Réponse : Un tableau contenant les coûts.
json
[ { "cost": 15000 }, { "cost": 10000 } ]
GET /cost
Rôle : Agréger les coûts. Récupère la somme de tous les SuperCosts (SUM(cost)) et coûts de réouverture (SUM(prix)) groupés par item_id.

Réponse :
json
[
  {
    "item_id": "Computer",
    "cost": 50000, 
    "prix": 5000,
    "gp": "timestamp_dernier"
  }
]
GET /costAll
Rôle : Récupérer l'intégralité des entrées de la table costItem (brutes, sans agrégation).

Réponse : Tableau contenant item_id, cost, id_ticket, et prix.
4.2. Gestion des Statuts
TIP

La route GET supporte la traduction via un paramètre de requête. Les langues supportées sont fr, en, et mg.

GET /status
Rôle : Récupérer la liste des statuts traduits.

Query Param : ?lang=fr|en|mg (par défaut fr).
Réponse :
json
[
  {
    "id": 1,
    "couleur": "#00d2ff",
    "name": "Nouveau"
  }
]
POST /status
Rôle : Ajouter un nouveau statut personnalisé.

Payload attendu (JSON) : couleur, name_fr, name_en, name_mg.
Réponse : 201 Created
PUT /status/<int:status_id>
Rôle : Mettre à jour partiellement ou totalement un statut existant (couleur et traductions).

Payload attendu (JSON) : couleur, name_fr, name_en, name_mg (les champs non renseignés conserveront leur valeur existante).
Réponse : 200 OK

source venv/bin/activate