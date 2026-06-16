import React, { useState } from 'react';
import { useSuperCostCsvParser } from '../services/ParserCsv'; 
import { fetchGlpiTickets, fetchGlpiTicketByExternalId } from '../services/CrudService'; 
import { apiLocalStatus } from '../api/configApi'; 
import { apiGlpi } from '../api/apiGlpi';
const CsvMouvement = () => {
  const { costData, parseCostFile } = useSuperCostCsvParser({ separator: ',' });
  const [allLinks, setAllLinks] = useState([]);
  const [importing, setImporting] = useState(false);
  const [imports,setImport]=useState({id:0,valeur:0,mvt:''});  
  const handleCostsUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      parseCostFile(file);
    }
  };
 const traiter = async (id, status, valeur, currentLinks = null) => {
  try {
    let linksRes; 

    if (currentLinks === null) {
      linksRes = await apiGlpi('Item_Ticket');
    } else {
      linksRes = currentLinks;
    }

    const safeLinks = Array.isArray(linksRes) ? linksRes : [];

    const glpiTicketMapped = await fetchGlpiTicketByExternalId(id);
    console.log(glpiTicketMapped);  
    
    if (!glpiTicketMapped || !glpiTicketMapped.id) {
      console.warn(`Aucun ticket GLPI trouvé pour l'ID externe : ${id}`);
      return;
    }

    const realGlpiId = glpiTicketMapped.id;
    
    const linkedItems = safeLinks.filter(item => parseInt(item.tickets_id, 10) === realGlpiId);
    const gp = Date.now();
    const currentStatusClean = String(status).toLowerCase().trim();

    if (currentStatusClean === "cancel") {
      await apiGlpi(`Ticket/${realGlpiId}`, {
        method: 'PUT',
        body: JSON.stringify({ input: { id: realGlpiId, status: 2 } })
      });

      await apiLocalStatus(`cost/${realGlpiId}`, {
        method: 'DELETE'
      });
      
      return; 
    }

    if ((currentStatusClean === "closed" || currentStatusClean === "close") && linkedItems.length > 0) {
      await apiGlpi(`Ticket/${realGlpiId}`, {
        method: 'PUT',
        body: JSON.stringify({ input: { id: realGlpiId, status: 6 } })
      });
    } else if (currentStatusClean === "open" && linkedItems.length > 0) {
      await apiGlpi(`Ticket/${realGlpiId}`, {
        method: 'PUT',
        body: JSON.stringify({ input: { id: realGlpiId, status: 2 } })
      });
    }

    for (const links of linkedItems) {
      
      if ((currentStatusClean === "closed" || currentStatusClean === "close")) {
        const numericCost = Number(valeur) || 0;
        
        let editingStatus = { 
          ticket_id: realGlpiId,
          cost: linkedItems.length > 0 ? (numericCost / linkedItems.length) : 0,
          item_id: links.itemtype,
          gp: gp
        };

        await apiLocalStatus('cost', {
          method: 'POST',
          body: JSON.stringify(editingStatus)   
        });
      }

      if (currentStatusClean === "open") {
        const url = `costLast?itemtype=${links.itemtype}&id_ticket=${realGlpiId}`;
        const localStatuses = await apiLocalStatus(url);
        
        const lastCost = (localStatuses && localStatuses.length > 0) ? localStatuses[0].cost : 0;
        const valiny = (lastCost * Number(valeur || 0)) / 100;
        
        let editingStatus = { 
          item_id: links.itemtype,
          cost: valiny || 0,
          ticket_id: realGlpiId,
          gp: gp
        };

        await apiLocalStatus('costPrix', {
          method: 'POST',
          body: JSON.stringify(editingStatus)
        });
      }
    }
  
  } catch (error) {
    console.error("Erreur dans traiter:", error);
  }
}
  const handleImportMain = async()=>{
    try{
           await traiter(imports.id,imports.mvt,imports.valeur);
           setImport({id:0,valeur:0,mvt:''}); 
    }catch(error){
        console.log(error);
    }
  }
  const startImport = async () => {
    if (!costData || costData.length === 0) return;
    
    setImporting(true);
    try {
      
      for (const data of costData) {
         await traiter(data.tickets_id,data.status,data.valeur);
      }
      console.log("Importation et mise à jour des statuts terminées !");
    } catch (error) {
      console.error("Erreur critique lors de l'injection :", error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div style={styles.card}>

      <div style={styles.cardHeader}>Grille de Tarification & Coûts</div>
     <div style={styles.formContainer}>
      <h3 style={styles.formTitle}>Importation Manuelle</h3>
      <p style={styles.formSubtitle}>Injecter des flux financiers directement dans la base locale</p>
      
      <div style={styles.fieldGroup}>
        <label style={styles.label}>ID du Ticket / Élément</label>
        <input 
          type="number" 
          placeholder="Ex: 952"
          value={imports.id}
          onChange={(e) => setImport({ ...imports, id: Number(e.target.value) })} 
          style={styles.input}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Valeur</label>
        <input 
          type="number" 
          placeholder="Ex: 45000"
          value={imports.valeur}
          onChange={(e) => setImport({ ...imports, valeur: Number(e.target.value) })} 
          style={styles.input}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Type de Mouvement</label>
        <input 
          type="text" 
          placeholder="Ex:closed,open,cancel"
          value={imports.mvt}
          onChange={(e) => setImport({ ...imports, mvt: e.target.value })} 
          style={styles.input}
        />
      </div>

      <button onClick={handleImportMain} style={styles.submitBtn}>
        Lancer l'importation
      </button>
    </div>
      <div style={styles.inputWrapper}>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleCostsUpload} 
          disabled={importing} 
          style={styles.fileInput} 
          id="file-costs"
        />
        <label htmlFor="file-costs" style={styles.fileLabel}>Choisir un fichier CSV</label>
        {costData?.length > 0 && (
          <div style={styles.badgeSuccess}>{costData.length} lignes financières prêtes</div>
        )}
      </div>
      <div style={styles.actionSection}>
        <button 
          onClick={startImport} 
          disabled={importing || !costData || costData.length === 0} 
          style={importing || !costData || costData.length === 0 ? styles.btnDisabled : styles.btnActive}
        >
          {importing ? "Exécution du traitement de masse..." : "Déclencher l'injection globale"}
        </button>
      </div>
    </div>
  );
};
const styles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E6EF',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)'
  },

  cardHeader: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1A1D2E',
    borderBottom: '1px solid #E2E6EF',
    paddingBottom: '10px'
  },

  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },

  fileInput: {
    display: 'none'
  },

  fileLabel: {
    display: 'block',
    textAlign: 'center',
    backgroundColor: 'rgba(67, 56, 202, 0.04)',
    border: '1px dashed rgba(67, 56, 202, 0.3)',
    color: '#4338CA',
    padding: '10px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s'
  },

  badgeSuccess: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    border: '1px solid rgba(5, 150, 105, 0.25)',
    color: '#059669',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    textAlign: 'center',
    fontWeight: '600'
  },

  actionSection: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '32px'
  },

  btnActive: {
    backgroundColor: '#4338CA',
    color: '#FFFFFF',
    border: 'none',
    padding: '14px 40px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '15px',
    transition: 'background 0.2s',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  btnDisabled: {
    backgroundColor: '#F1F3F9',
    color: '#8B92A8',
    border: '1px solid #E2E6EF',
    padding: '14px 40px',
    borderRadius: '10px',
    cursor: 'not-allowed',
    fontWeight: '700',
    fontSize: '15px'
  },

  formContainer: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E6EF',
    borderRadius: '14px',
    padding: '24px',
    maxWidth: '450px',
    margin: '20px auto',
    boxShadow: '0 2px 12px rgba(26, 29, 46, 0.04)',
    fontFamily: "'Inter', system-ui, sans-serif"
  },

  formTitle: {
    margin: '0 0 6px 0',
    color: '#4338CA',
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.01em'
  },

  formSubtitle: {
    margin: '0 0 20px 0',
    color: '#8B92A8',
    fontSize: '12px',
    lineHeight: '1.4'
  },

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '16px'
  },

  label: {
    color: '#5A6178',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },

  input: {
    backgroundColor: '#F8F9FC',
    border: '1px solid #E2E6EF',
    borderRadius: '10px',
    color: '#1A1D2E',
    padding: '12px 14px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  },

  submitBtn: {
    width: '100%',
    backgroundColor: '#4338CA',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    marginTop: '8px'
  }
};

export default CsvMouvement;