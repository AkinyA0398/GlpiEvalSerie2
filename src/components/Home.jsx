// components/Home.js (ou le nom de ton choix)

import { useNavigate } from 'react-router-dom';
import { initGlpiSession } from '../api/apiGlpi'; 

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
    navigate("/list");
  }

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2>Bienvenue</h2>
        <p>Veuillez vous connecter pour accéder à l'application.</p>
        <button onClick={handleLogin} style={styles.button}>
          Se connecter admin
        </button>
        <button onClick={handleFront} style={styles.button}>
          voir le frontOffice
        </button>
        
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Arial', backgroundColor: '#f1f5f9', color: '#0f172a' },
  loginBox: { padding: '20px', border: '1px solid #e2e8f0', borderRadius: '5px', textAlign: 'center', backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  button: { padding: '10px 20px', backgroundImage: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', margin: '5px', boxShadow: '0 4px 6px -1px rgba(0, 114, 255, 0.2)' }
};

export default Home;