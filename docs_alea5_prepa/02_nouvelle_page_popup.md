# Documentation : Création de Nouvelle Page et Pop-up en React

## 1. Créer une Nouvelle Page

La création d'une nouvelle page dans React se fait généralement en deux étapes : la création du composant React, puis l'ajout d'une route dans le routeur.

### Étape 1 : Créer le composant de la page
Créez un nouveau fichier `MyNewPage.jsx` dans votre dossier `pages/` ou `components/`.

```javascript
import React from 'react';

const MyNewPage = () => {
    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Ma Nouvelle Page</h1>
            <div className="bg-white p-6 rounded-lg shadow">
                <p>Bienvenue sur cette nouvelle interface. Vous pouvez y ajouter vos formulaires ou tableaux.</p>
            </div>
        </div>
    );
};

export default MyNewPage;
```

### Étape 2 : Ajouter la route dans React Router
Dans votre fichier principal (par exemple `App.jsx`, `main.jsx` ou votre routeur dédié), importez votre page et liez-la à une URL.

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MyNewPage from './pages/MyNewPage';
// ... autres imports

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Vos routes existantes */}
                <Route path="/" element={<Home />} />
                
                {/* Votre NOUVELLE route */}
                <Route path="/ma-nouvelle-page" element={<MyNewPage />} />
            </Routes>
        </BrowserRouter>
    );
}
```

---

## 2. Créer une Pop-up (Modale)

Une pop-up s'affiche en surimpression du contenu principal de la page grâce au rendu conditionnel basé sur un `state` (état local).

### Implémentation du composant Pop-up
Dans le composant parent où la pop-up doit s'afficher, on crée un state `isPopupOpen` :

```javascript
import React, { useState } from 'react';

const PageWithPopup = () => {
    // State pour contrôler l'ouverture et la fermeture de la pop-up
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    return (
        <div className="p-6 relative">
            <h1 className="text-2xl font-bold mb-4">Gestion avec Pop-up</h1>
            
            {/* Bouton pour ouvrir la modale */}
            <button 
                onClick={() => setIsPopupOpen(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700"
            >
                Ouvrir la Pop-up
            </button>

            {/* Condition d'affichage de la Pop-up */}
            {isPopupOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    {/* Conteneur de la Modale */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4 border-b pb-2">Titre de la Pop-up</h2>
                        <p className="mb-6 text-gray-600">
                            Ceci est le contenu de votre modale. Vous pouvez y intégrer un formulaire ou un message de confirmation.
                        </p>
                        
                        {/* Boutons d'action */}
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setIsPopupOpen(false)}
                                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-800"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={() => {
                                    alert('Action validée !');
                                    setIsPopupOpen(false); // Ferme la pop-up après l'action
                                }}
                                className="px-4 py-2 bg-indigo-600 rounded text-white hover:bg-indigo-700"
                            >
                                Valider
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageWithPopup;
```

### Explications Clés pour le CSS (Tailwind)
* `fixed inset-0` : Fixe la modale sur tout l'écran (top 0, right 0, bottom 0, left 0).
* `bg-black bg-opacity-50` : Crée l'arrière-plan semi-transparent (Overlay) grisant la page.
* `flex justify-center items-center` : Permet de centrer parfaitement le carré de la modale.
* `z-50` : S'assure que la modale passe au-dessus de tous les autres éléments de la page.
