import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../AuthModal/services/authService';

const Dashboard = () => {
  const navigate = useNavigate();
  let username = 'User';
  try {
    const profile = localStorage.getItem('user_profile');
    if (profile) {
      const p = JSON.parse(profile);
      username = p.user_name || p.username || p.first_name || p.firstName || username;
    }
  } catch {}

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      const result = await authService.logout(refresh);
      // ignore result: we've already cleared tokens on success; if failure, still clear and navigate
      try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); localStorage.removeItem('user_profile'); } catch {}
      navigate('/');
    } catch (err) {
      try { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); localStorage.removeItem('user_profile'); } catch {}
      navigate('/');
    }
  };

  return (
    <div style={{ backgroundColor: '#ffffff', color: '#000000', minHeight: '10vh' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #eee' }}>
        <div style={{ fontWeight: 700 }}>Dashboard</div>
        <div>
          <button onClick={handleLogout} style={{ background: '#000', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </nav>

      <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <h1 style={{ margin: 0 }}>Welcome ({username})</h1>
      </main>
    </div>
  );
};

export default Dashboard;
