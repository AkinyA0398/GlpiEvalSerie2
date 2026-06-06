import React, { useState, useRef } from 'react';

interface CsvSlot {
  label: string;
  key: string;
  description: string;
  icon: string;
}

const CSV_SLOTS: CsvSlot[] = [
  { key: 'csv1', label: 'Fichier CSV 1', description: 'Premier fichier de données', icon: '📋' },
  { key: 'csv2', label: 'Fichier CSV 2', description: 'Deuxième fichier de données', icon: '📋' },
  { key: 'csv3', label: 'Fichier CSV 3', description: 'Troisième fichier de données', icon: '📋' },
];

type Status = 'idle' | 'loading' | 'success' | 'error';

export const ImportPage: React.FC = () => {
  const [csvFiles, setCsvFiles] = useState<Record<string, File | null>>({ csv1: null, csv2: null, csv3: null });
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<Status>('idle');
  const [importMessage, setImportMessage] = useState('');

  const csvRefs = useRef<Record<string, HTMLInputElement | null>>({ csv1: null, csv2: null, csv3: null });
  const zipRef = useRef<HTMLInputElement | null>(null);

  const handleCsvChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith('.csv')) {
      setImportMessage(`Le fichier "${file.name}" n'est pas un CSV valide.`);
      setImportStatus('error');
      return;
    }
    setCsvFiles(prev => ({ ...prev, [key]: file }));
    setImportStatus('idle');
    setImportMessage('');
  };

  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && !file.name.endsWith('.zip')) {
      setImportMessage(`Le fichier "${file.name}" n'est pas un ZIP valide.`);
      setImportStatus('error');
      return;
    }
    setZipFile(file);
    setImportStatus('idle');
    setImportMessage('');
  };

  const handleImportAll = async () => {
    const selectedCsv = Object.values(csvFiles).filter(Boolean) as File[];
    if (selectedCsv.length === 0 && !zipFile) {
      setImportMessage('Veuillez sélectionner au moins un fichier CSV ou une archive ZIP.');
      setImportStatus('error');
      return;
    }
    setImportStatus('loading');
    setImportMessage('');
    try {
      const formData = new FormData();
      selectedCsv.forEach(f => formData.append('files', f));
      if (zipFile) formData.append('archive', zipFile);

      const res = await fetch('/api/import/all', { method: 'POST', body: formData });
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      let data: { error?: string; message?: string } | null = null;
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(text);
        } catch {
          // fallthrough to raw message
        }
      }

      if (!res.ok) {
        // si le serveur renvoie une page HTML (404/500), on affiche le body brut
        const fallback = text?.slice(0, 500) || '';
        throw new Error(
          data?.error || data?.message || `Erreur serveur (HTTP ${res.status}) : ${fallback}`
        );
      }

      // res.ok = true
      if (data?.message) {
        setImportMessage(data.message);
      } else {
        setImportMessage(text || 'Import terminé.');
      }
      setImportStatus('success');
    } catch (err) {
      setImportMessage(err instanceof Error ? err.message : 'Erreur inconnue');
      setImportStatus('error');
    }
  };

  const csvSelectedCount = Object.values(csvFiles).filter(Boolean).length;
  const totalSelected = csvSelectedCount + (zipFile ? 1 : 0);

  return (
    <div className="bo-page">
      <div className="bo-page-header">
        <div>
          <h1 className="bo-page-title">Importer les données</h1>
          <p className="bo-page-sub">Chargez vos fichiers CSV et l'archive d'images — tout sera importé dans GLPI en une seule opération</p>
        </div>
      </div>

      <div className="bo-cards-grid">
        {/* ── Section CSV ── */}
        <div className="bo-card bo-card-wide">
          <div className="bo-card-head">
            <div className="bo-card-icon csv-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h2 className="bo-card-title">Fichiers CSV</h2>
              <p className="bo-card-desc">3 fichiers CSV — sauvegardés dans <code>/import/csv</code></p>
            </div>
            {csvSelectedCount > 0 && (
              <span className="bo-badge">{csvSelectedCount}/3 sélectionné{csvSelectedCount > 1 ? 's' : ''}</span>
            )}
          </div>

          <div className="csv-slots">
            {CSV_SLOTS.map(slot => {
              const file = csvFiles[slot.key];
              return (
                <div
                  key={slot.key}
                  className={`csv-slot ${file ? 'slot-filled' : ''}`}
                  onClick={() => csvRefs.current[slot.key]?.click()}
                  id={`slot-${slot.key}`}
                >
                  <input
                    ref={el => { csvRefs.current[slot.key] = el; }}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={e => handleCsvChange(slot.key, e)}
                    id={`input-${slot.key}`}
                  />
                  <div className="slot-icon">{file ? '✅' : slot.icon}</div>
                  <div className="slot-info">
                    <span className="slot-label">{slot.label}</span>
                    <span className="slot-file">{file ? file.name : slot.description}</span>
                  </div>
                  {file && (
                    <button
                      className="slot-remove"
                      onClick={e => { e.stopPropagation(); setCsvFiles(prev => ({ ...prev, [slot.key]: null })); }}
                      title="Retirer"
                    >✕</button>
                  )}
                  {!file && <span className="slot-browse">Parcourir</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Section ZIP Images ── */}
        <div className="bo-card">
          <div className="bo-card-head">
            <div className="bo-card-icon zip-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v18M3 9h6M3 15h6" />
              </svg>
            </div>
            <div>
              <h2 className="bo-card-title">Archive Images</h2>
              <p className="bo-card-desc">1 fichier ZIP — images uploadées dans GLPI</p>
            </div>
          </div>

          <div
            className={`zip-dropzone ${zipFile ? 'zip-filled' : ''}`}
            onClick={() => zipRef.current?.click()}
            id="zip-dropzone"
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f?.name.endsWith('.zip')) { setZipFile(f); setImportStatus('idle'); setImportMessage(''); }
              else { setImportMessage('Format invalide — uniquement .zip'); setImportStatus('error'); }
            }}
          >
            <input
              ref={zipRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={handleZipChange}
              id="input-zip"
            />
            {zipFile ? (
              <div className="zip-selected">
                <span className="zip-file-icon">🗜️</span>
                <div>
                  <div className="zip-filename">{zipFile.name}</div>
                  <div className="zip-filesize">{(zipFile.size / 1024 / 1024).toFixed(2)} Mo</div>
                </div>
                <button
                  className="slot-remove"
                  onClick={e => { e.stopPropagation(); setZipFile(null); }}
                  title="Retirer"
                >✕</button>
              </div>
            ) : (
              <div className="zip-placeholder">
                <div className="zip-ph-icon">🗜️</div>
                <p>Glisser-déposer ou cliquer pour sélectionner</p>
                <span>Format accepté : .zip uniquement</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Message + Bouton unifié ── */}
      {importMessage && (
        <div className={`bo-alert ${importStatus === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '1.5rem' }}>
          {importStatus === 'success' ? '✅' : '❌'} {importMessage}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button
          className="bo-btn bo-btn-primary"
          onClick={handleImportAll}
          disabled={importStatus === 'loading' || totalSelected === 0}
          id="btn-import-all"
          style={{ fontSize: '1.05rem', padding: '0.85rem 2.5rem' }}
        >
          {importStatus === 'loading' ? (
            <><span className="spinner" />Import en cours…</>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Importer tout ({totalSelected} fichier{totalSelected > 1 ? 's' : ''})
            </>
          )}
        </button>
      </div>
    </div>
  );
};
