# Documentation : Import CSV

## 1. Côté Frontend (React)
L'importation de fichiers CSV côté client peut se faire nativement avec l'API `FileReader` ou avec des librairies spécialisées comme `PapaParse`.

### Nativement avec FileReader
Voici comment lire le contenu d'un fichier CSV en texte brut avant de l'envoyer ou de le traiter :

```javascript
import React, { useState } from 'react';

const CsvImport = () => {
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            console.log("Contenu du CSV :", text);
            // Traiter le texte, par exemple split('\n') puis split(',')
        };
        reader.readAsText(file);
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Importer un fichier CSV</h2>
            <input 
                type="file" 
                accept=".csv" 
                onChange={handleFileUpload} 
                className="border p-2 rounded"
            />
        </div>
    );
};
export default CsvImport;
```

## 2. Envoi vers le Backend via Fetch
Pour envoyer directement le fichier CSV au backend sans le lire côté client, on utilise l'objet `FormData`.

```javascript
const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file); // "file" sera le nom du champ reçu par le backend

    try {
        const response = await fetch("http://localhost:5000/upload-csv", {
            method: "POST",
            body: formData, 
            // Important : Ne PAS définir de Content-Type manuellement avec FormData
            // Le navigateur s'en charge automatiquement pour gérer le multipart/form-data
        });
        const data = await response.json();
        console.log("Succès :", data);
    } catch (error) {
        console.error("Erreur d'envoi :", error);
    }
};
```

## 3. Côté Backend (Exemple en Python - Flask)
Côté backend, on récupère le fichier, on le lit en tant que CSV puis on effectue les insertions en base de données.

```python
import csv
from flask import request, jsonify

@app.route('/upload-csv', methods=['POST'])
def upload_csv():
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "Aucun fichier n'a été fourni"}), 400

    # Lire le fichier CSV
    # decode("utf-8") convertit les bytes en string
    stream = file.stream.read().decode("utf-8").splitlines()
    csv_reader = csv.DictReader(stream)
    
    data = []
    for row in csv_reader:
        data.append(row)
        # Ici vous pouvez insérer 'row' dans votre base de données SQLite/MySQL
        
    return jsonify({"message": "Fichier traité avec succès", "lignes_lues": len(data)}), 200
```
