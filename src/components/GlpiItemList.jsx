import React, { useState, useEffect } from 'react';
import { fetchGlpiItems, fetchGlpiDocumentItems, fetchGlpiDocumentImage } from '../services/CrudService';
import { apiGlpi } from '../api/apiGlpi';

const GlpiItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la recherche multi-critères
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedManufacturer, setSelectedManufacturer] = useState('');

  // Listes de filtres uniques (Textuels)
  const [typesList] = useState(['Computer', 'Monitor', 'Phone']);
  const [statusesList, setStatusesList] = useState([]);
  const [manufacturersList, setManufacturersList] = useState([]);

  // Vérification de la session pour savoir s'il faut inclure le Layout admin
  const isAdmin = localStorage.getItem('adminSession') === 'admin';

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      let manufacturerMap = {};
      let statusMap = {};

      // 1. Récupération des dictionnaires de correspondances
      try {
        const [manufacturersData, statusesData] = await Promise.all([
          apiGlpi('Manufacturer').catch(() => []),
          apiGlpi('State').catch(() => [])
        ]);

        if (Array.isArray(manufacturersData)) {
          manufacturersData.forEach(m => { manufacturerMap[m.id] = m.name; });
        }
        if (Array.isArray(statusesData)) {
          statusesData.forEach(s => { statusMap[s.id] = s.name; });
        }
      } catch (e) {
        console.warn("Erreur lors du chargement des dictionnaires GLPI :", e);
      }

      // 2. Récupération des éléments du parc matériel
      const typesToFetch = ['Computer', 'Monitor', 'Phone']; 
      const itemsPromises = typesToFetch.map(async (type) => {
        try {
          const res = await fetchGlpiItems(type);
          const cleanItems = Array.isArray(res) ? res : [];
          return cleanItems.map(item => ({ ...item, itemtype: type }));
        } catch {
          return []; 
        }
      });

      const allItemsResults = await Promise.all(itemsPromises);
      const combinedItems = allItemsResults.flat();

      // 3. Récupération de la table des liaisons de documents
      let docItemsMap = {};
      try {
        const docItems = await fetchGlpiDocumentItems();
        if (Array.isArray(docItems)) {
          docItems.forEach(link => {
            const key = `${link.itemtype}-${link.items_id}`;
            docItemsMap[key] = link.documents_id;
          });
        }
      } catch (e) {
        console.warn("Impossible de charger les liaisons d'images :", e);
      }

      // 4. Reconstruction des objets et RÉSOLUTION SIMULTANÉE des images de type Blob

const enrichedItems = await Promise.all(
  combinedItems.map(async (item) => {
    const key = `${item.itemtype}-${item.id}`;
    // Ajoute ce log temporaire pour voir la clé générée
    if (item.name === "PC-COMPTA-001") {
      console.log(`Test pour PC-COMPTA-001 -> Clé générée: ${key}, Trouvé en map ?`, docItemsMap[key]);
    }
    
    const documentId = docItemsMap[key] || null;
          let imageUrl = null;

          // Si un document est lié, on télécharge immédiatement le Blob d'image
          if (documentId) {
            try {
              imageUrl = await fetchGlpiDocumentImage(documentId);
            } catch (imgErr) {
              console.error(`Erreur Blob sur document ID ${documentId}:`, imgErr);
            }
          }

          return {
            ...item,
            manufacturerName: manufacturerMap[item.manufacturers_id] || "Inconnu",
            statusName: statusMap[item.states_id] || "Par defaut",
            documentId,
            imageUrl
          };
        })
      );

      // 5. Unique mise à jour de l'état avec l'ensemble des données prêtes
      setItems(enrichedItems);

      // Génération des listes de filtres uniques
      const uniqueStatuses = [...new Set(enrichedItems.map(i => i.statusName))];
      const uniqueManufacturers = [...new Set(enrichedItems.map(i => i.manufacturerName))];
      
      setStatusesList(uniqueStatuses);
      setManufacturersList(uniqueManufacturers);

    } catch (err) {
      setError(`Erreur lors du chargement des composants : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.inventoryNumber && item.inventoryNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.serial && item.serial.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === '' || item.itemtype === selectedType;
    const matchesStatus = selectedStatus === '' || item.statusName === selectedStatus;
    const matchesManufacturer = selectedManufacturer === '' || item.manufacturerName === selectedManufacturer;

    return matchesSearch && matchesType && matchesStatus && matchesManufacturer;
  });


  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Indexation et resolution du parc GLPI...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorText}>Erreur systeme : {error}</div>
      </div>
    );
  }

  const renderContent = () => (
    <div style={styles.pageContent}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>Inventaire du Parc Informatique</h2>
        <p style={styles.subtitle}>Index global triable, recherche multicriteres et statut en temps reel.</p>
      </div>

      {/* 🔍 FILTRES DE RECHERCHE */}
      <div style={styles.filterSection}>
        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Recherche globale</label>
          <input 
            type="text" 
            placeholder="Nom, num inventaire, serie..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Categorie</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={styles.select}>
            <option value="">Toutes les categories</option>
            {typesList.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Statut operationnel</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={styles.select}>
            <option value="">Tous les statuts</option>
            {statusesList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Constructeur</label>
          <select value={selectedManufacturer} onChange={(e) => setSelectedManufacturer(e.target.value)} style={styles.select}>
            <option value="">Tous les fabricants</option>
            {manufacturersList.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* COMPTEUR METRIQUE */}
      <div style={styles.metaCounter}>
        Filtre actif : {filteredItems.length} element(s) liste(s) sur un total de {items.length} actifs enregistres.
      </div>

      {/* 🎴 GRILLE DES CARTES ACTIFS */}
      <div style={styles.grid}>
        {filteredItems.map((item, index) => (
          <div key={`${item.itemtype || 'item'}-${item.id || index}-${index}`} style={styles.card}>
            
            {/* ZONE IMAGE BLOB / COUVERTURE */}
            <div style={styles.imageContainer}>
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name} 
                  style={styles.image}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = "https://placehold.co/280x160/F1F3F9/8B92A8?text=Image+Indisponible";
                  }}
                />
              ) : (
                <div style={styles.noImageText}>Aucun rendu visuel</div>
              )}
            </div>

            {/* DESCRIPTION DU MATERIEL */}
            <div style={styles.cardBody}>
              <div>
                <span style={styles.typeBadge}>{item.itemtype}</span>
                <h4 style={styles.itemTitle}>{item.name || "Actif sans label"}</h4>
                <div style={styles.inventoryLine}>
                  <span style={styles.metaLabel}>N° Inventaire :</span> {item.inventoryNumber || item.otherserial || '—'}
                </div>
              </div>

              <div style={styles.cardFooter}>
                <div style={styles.footerLine}>
                  <span style={styles.statusDot}></span>
                  <span style={styles.metaLabel}>Statut :</span> {item.statusName}
                </div>
                <div style={styles.footerLine}>
                  <span style={styles.metaLabel}>Fabricant :</span> {item.manufacturerName}
                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div style={styles.emptyContainer}>
          Aucun element du parc informatique ne correspond aux criteres de filtrage selectionnes.
        </div>
      )}
    </div>
  );

  return  <div style={styles.standalonePage}>{renderContent()}</div>;
};

const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8F9FC' },
  loadingText: { color: '#4338CA', fontSize: '14px', fontWeight: '600' },
  errorContainer: { padding: '24px', backgroundColor: '#FFFFFF', border: '1px solid rgba(220, 38, 38, 0.2)', margin: '40px', borderRadius: '12px' },
  errorText: { color: '#DC2626', fontSize: '14px', margin: 0 },
  standalonePage: { backgroundColor: '#F8F9FC', minHeight: '100vh', padding: '40px', boxSizing: 'border-box', color: '#1A1D2E', fontFamily: "'Inter', system-ui, -apple-system, sans-serif" },
  pageContent: { width: '100%' },
  header: { borderBottom: '1px solid #E2E6EF', paddingBottom: '16px', marginBottom: '24px' },
  mainTitle: { fontSize: '22px', fontWeight: '800', color: '#1A1D2E', margin: '0 0 6px 0', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '14px', color: '#8B92A8', margin: 0 },
  filterSection: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', boxShadow: '0 1px 3px rgba(26, 29, 46, 0.04)' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  filterLabel: { fontSize: '12px', fontWeight: '600', color: '#5A6178', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '10px 12px', backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', borderRadius: '8px', color: '#1A1D2E', fontSize: '13px', boxSizing: 'border-box', outline: 'none', fontFamily: "'Inter', sans-serif" },
  select: { width: '100%', padding: '10px 12px', backgroundColor: '#F8F9FC', border: '1px solid #E2E6EF', borderRadius: '8px', color: '#1A1D2E', fontSize: '13px', boxSizing: 'border-box', outline: 'none' },
  metaCounter: { fontSize: '13px', color: '#8B92A8', fontWeight: '500', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' },
  card: { backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', boxShadow: '0 2px 12px rgba(26, 29, 46, 0.05)', transition: 'box-shadow 0.2s' },
  imageContainer: { height: '150px', backgroundColor: '#F1F3F9', borderBottom: '1px solid #E2E6EF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  noImageText: { color: '#8B92A8', fontSize: '12px', textTransform: 'uppercase', fontWeight: '500' },
  cardBody: { padding: '18px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' },
  typeBadge: { fontSize: '10px', fontWeight: '700', color: '#4338CA', backgroundColor: 'rgba(67, 56, 202, 0.08)', border: '1px solid rgba(67, 56, 202, 0.2)', padding: '3px 8px', borderRadius: '5px', textTransform: 'uppercase', display: 'inline-block' },
  itemTitle: { margin: '8px 0 4px 0', color: '#1A1D2E', fontSize: '15px', fontWeight: '700' },
  inventoryLine: { fontSize: '12px', color: '#5A6178' },
  metaLabel: { color: '#8B92A8', fontWeight: '600' },
  cardFooter: { borderTop: '1px solid #E2E6EF', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' },
  footerLine: { display: 'flex', alignItems: 'center', gap: '6px', color: '#5A6178' },
  statusDot: { width: '6px', height: '6px', backgroundColor: '#059669', borderRadius: '50%' },
  emptyContainer: { textAlign: 'center', padding: '40px', color: '#8B92A8', border: '1px dashed #E2E6EF', borderRadius: '12px', marginTop: '24px', fontSize: '13px' }
};

export default GlpiItemList;