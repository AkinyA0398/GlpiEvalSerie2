// components/Home.js (ou le nom de ton choix)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { initGlpiSession } from '../api/apiGlpi'; 
import { createGlpiCustomStatus, createGlpiStatus } from '../services/CrudService';
import GlpiReset from './GlpiReset';
const Home = () => {
  const navigate = useNavigate();
   
  const handleLogin = async () => {
    try {
      await initGlpiSession();
      navigate("/LoginBack");
    } catch (error) {
      console.error("Erreur lors de la connexion GLPI :", error);
    }
  };
  const handleFront =()=>{
    navigate("/testCsv");
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <div style={styles.brand}>GLPI</div>
        <h2 style={styles.title}>Bienvenue</h2>
        <p style={styles.subtitle}>Veuillez vous connecter pour acceder a l'application de gestion du parc informatique.</p>
        <div style={styles.buttonGroup}>
          <button onClick={handleLogin} style={styles.buttonPrimary}>
            Se connecter admin
          </button>
          <button onClick={handleFront} style={styles.buttonSecondary}>
            Voir le frontOffice
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: "'Inter', system-ui, sans-serif", background: 'linear-gradient(145deg, #F8F9FC 0%, #EEF0F7 100%)' },
  loginBox: { padding: '40px', backgroundColor: '#FFFFFF', border: '1px solid #E2E6EF', borderRadius: '16px', textAlign: 'center', boxShadow: '0 8px 32px rgba(26, 29, 46, 0.1)', maxWidth: '420px', width: '100%' },
  brand: { fontSize: '14px', fontWeight: '800', color: '#4338CA', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' },
  title: { margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#1A1D2E' },
  subtitle: { margin: '0 0 28px 0', fontSize: '14px', color: '#8B92A8', lineHeight: '1.5' },
  buttonGroup: { display: 'flex', flexDirection: 'column', gap: '12px' },
  buttonPrimary: { padding: '12px 24px', backgroundColor: '#4338CA', color: '#FFFFFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', transition: 'background 0.2s', letterSpacing: '-0.01em' },
  buttonSecondary: { padding: '12px 24px', backgroundColor: '#F1F3F9', color: '#4338CA', border: '1px solid #E2E6EF', borderRadius: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }
};

export default Home;