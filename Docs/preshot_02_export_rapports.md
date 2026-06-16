# Sujet à Venir : Exportation des Rapports Analytiques (PDF/Excel)

## Contexte
Le composant `TicketsCost.jsx` et `ResumeTicket.jsx` agrègent de nombreuses données financières. Les administrateurs auront rapidement besoin d'exporter ces tableaux pour la comptabilité, les audits ou les réunions de direction. L'implémentation de cette fonctionnalité se fera entièrement côté client (React) pour ne pas surcharger le backend.

## Fichiers à Modifier

### 1. Frontend React (`package.json`)
- **Action** : Installer les dépendances nécessaires pour générer des fichiers côté client.
- **Code Clé** :
```bash
npm install xlsx file-saver jspdf jspdf-autotable
```

### 2. Frontend React (`src/components/ResumeTicket.jsx`)
- **Action** : Ajouter une fonction pour parser l'état `hardwareSummary` et le convertir en fichier `.xlsx`.
- **Code Clé (Export Excel avec `xlsx`)** :
```javascript
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const exportToExcel = (hardwareSummary, grandTotals) => {
  // 1. Formater les données brutes pour l'export
  const dataToExport = hardwareSummary.map(item => ({
    "Catégorie": item.category,
    "Nombre de tickets": item.count,
    "Coût GLPI (MGA)": item.glpiCost,
    "Coût Saisi Local (MGA)": item.superCost,
    "Coût Réouverture (MGA)": item.reouverture,
    "Coût Total Final (MGA)": item.totalCost
  }));

  // Ajouter la ligne des totaux à la fin
  dataToExport.push({
    "Catégorie": "TOTAL GLOBAL",
    "Coût GLPI (MGA)": grandTotals.glpi,
    "Coût Saisi Local (MGA)": grandTotals.super,
    "Coût Réouverture (MGA)": grandTotals.reouverture,
    "Coût Total Final (MGA)": grandTotals.all
  });

  // 2. Créer le classeur virtuellement
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Résumé Financier");

  // 3. Styliser les colonnes (optionnel)
  worksheet['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }];

  // 4. Générer le fichier binaire et déclencher le téléchargement
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  saveAs(data, `rapport_financier_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Utilisation dans le JSX (Zone d'en-tête du tableau) :
// <button onClick={() => exportToExcel(hardwareSummary, { glpi: grandTotalGlpi, super: grandTotalSuper, reouverture: grandTotalReouverture, all: grandTotalAll })} style={styles.exportBtn}>
//   📥 Exporter en Excel
// </button>
```

### 3. Frontend React (`src/components/TicketsCost.jsx`)
- **Action** : Ajouter la même fonctionnalité d'export pour la vue détaillée (liste des tickets individuels). L'approche est strictement identique, seule la structure de l'objet `dataToExport` change pour refléter les colonnes du composant `TicketsCost`.
