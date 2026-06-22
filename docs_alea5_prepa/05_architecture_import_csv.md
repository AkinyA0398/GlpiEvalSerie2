# Documentation : Architecture et Modification des Imports CSV

Dans le projet `GlpiEvalSerie2_v2`, l'importation de fichiers CSV est hautement structurée. Elle est séparée en 3 couches distinctes pour séparer la lecture du fichier, la logique métier/envoi, et le stockage en base de données.

Si vous devez **ajouter un nouvel import CSV** ou **modifier un import existant** (par exemple, pour ajouter une nouvelle colonne "Description" ou "Date" depuis le fichier source), vous devrez intervenir sur les 3 fichiers suivants :

---

## 1. La Couche de Lecture (Parser)
**Fichier à toucher : `src/services/ParserCsv.jsx`**

C'est ici que le fichier CSV texte est découpé ligne par ligne et converti en un tableau d'objets JavaScript. Ce fichier contient plusieurs "Hooks" spécialisés (ex: `useCsvParser`, `useSuperCostCsvParser`).

**Que faire en cas d'ajout d'une colonne ?**
1. Identifiez le Hook utilisé (par exemple `useSuperCostCsvParser`).
2. Dans la boucle `for`, repérez la ligne qui "découpe" (destructuring) le tableau `fields`. Ajoutez votre nouvelle variable.
3. Insérez cette nouvelle variable dans l'objet "poussé" (`push`) dans le tableau final.

**Exemple de modification :**
```javascript
// ÉTAPE 1 : On ajoute "descriptionCsv" dans le découpage
const [numTicket, mvt, valeur, modeCsv, descriptionCsv] = fields;

// ÉTAPE 2 : On l'ajoute dans l'objet renvoyé
parsedCosts.push({
    tickets_id: parseInt(numTicket, 10),
    status: mvt ? mvt.trim() : '',
    valeur: parseFloat(valeur) || 0,
    mode: modeCsv ? String(modeCsv).trim() : null,
    
    // NOUVEAU CHAMP :
    description: descriptionCsv ? descriptionCsv.trim() : "Aucune description" 
});
```

---

## 2. La Couche Métier / Interface (UI)
**Fichier à toucher : `src/components/CsvMouvement.jsx` (ou `CsvDynamicTester.jsx`)**

Ce fichier contient l'interface utilisateur (les boutons d'import). Il utilise le Hook de `ParserCsv.jsx` pour récupérer les données, puis itère dessus pour envoyer les requêtes API (souvent via `traiter()`).

**Que faire en cas d'ajout d'une colonne ?**
1. Modifiez la signature de la fonction `traiter()` (si elle reçoit les attributs un par un) pour accepter le nouveau paramètre, OU passez l'objet complet.
2. Ajoutez ce nouveau champ dans l'objet `editingStatus` (le corps/body JSON de votre requête fetch).

**Exemple de modification dans `CsvMouvement.jsx` :**
```javascript
// Dans la fonction traiter() :
const editingStatus = {
    item_id: links.itemtype,
    cost: Number(valiny) || 0,
    ticket_id: realGlpiId,
    gp: Date.now(),
    
    // NOUVEAU CHAMP récupéré du parseur pour être envoyé à l'API Python
    description: data.description 
};

// Requête fetch vers Python
await apiLocalStatus('costPrix', {
    method: 'POST',
    body: JSON.stringify(editingStatus)
});
```

---

## 3. La Couche Backend (Base de données)
**Fichier à toucher : `MyApi/app.py`**

L'API Flask en Python reçoit le JSON envoyé par le composant React et se charge de l'insérer dans la base de données SQLite.

**Que faire en cas d'ajout d'une colonne ?**
1. Vérifiez que la colonne existe dans votre base de données SQLite. Si ce n'est pas le cas, vous devez d'abord faire un `ALTER TABLE` ou modifier la création des tables dans `app.py`.
2. Dans la route correspondante (ex: `@app.route('/api/local/costPrix', methods=['POST'])`), extrayez la nouvelle donnée du JSON.
3. Ajoutez cette donnée dans la requête SQL `INSERT INTO` (ou `UPDATE`).

**Exemple de modification dans `app.py` :**
```python
@app.route('/api/local/costPrix', methods=['POST'])
def add_cost_prix():
    data = request.json
    
    # Récupération des données existantes
    item_id = data.get('item_id')
    cost = data.get('cost')
    ticket_id = data.get('ticket_id')
    gp = data.get('gp')
    
    # NOUVEAU CHAMP : Extraction depuis le JSON
    description = data.get('description', '')

    # NOUVELLE REQUÊTE SQL (avec le champ supplémentaire)
    cursor.execute('''
        INSERT INTO your_table_name (item_id, cost, ticket_id, gp, description) 
        VALUES (?, ?, ?, ?, ?)
    ''', (item_id, cost, ticket_id, gp, description))
    
    conn.commit()
```

---

## 🔄 Résumé du Flux de Données (Workflow d'ajout)

1. **Le fichier CSV physique** a une nouvelle colonne.
2. **`ParserCsv.jsx`** lit le texte CSV et attribue cette colonne à la clé `description` d'un objet JavaScript.
3. **`CsvMouvement.jsx`** prend cet objet JS contenant `description` et le place dans le format JSON du `fetch`.
4. **`app.py`** reçoit la requête HTTP, lit le champ `description` du JSON et l'insère dans la table SQLite.
