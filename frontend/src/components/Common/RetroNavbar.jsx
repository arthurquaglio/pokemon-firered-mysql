import React, { useState } from 'react';
import sounds from '../../services/soundEffects';

export default function RetroNavbar({ activeTab, onTabChange, onQuickJoy, joyLoading = false }) {
  const [muted, setMuted] = useState(sounds.isMuted());

  const handleMuteToggle = () => {
    const isNowMuted = sounds.toggleMute();
    setMuted(isNowMuted);
  };

  return (
    <header
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderBottom: '3px solid #334155',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '10px 20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Logo e Título */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png"
            alt="Pokéball"
            className="pixelated"
            style={{ width: '28px', height: '28px' }}
          />
          <div>
            <h1
              className="retro-text"
              style={{
                fontSize: '13px',
                color: '#ef4444',
                textShadow: '2px 2px 0 #000',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              POKÉMON FIRERED
              <span
                style={{
                  fontSize: '9px',
                  background: '#f97316',
                  color: '#fff',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  textShadow: 'none'
                }}
              >
                GBA SIMULATOR
              </span>
            </h1>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Motor Relacional de Batalhas no MySQL 8.0
            </span>
          </div>
        </div>

        {/* Abas de Navegação */}
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { sounds.playSelect(); onTabChange('teambuilder'); }}
            className={`btn-retro ${activeTab === 'teambuilder' ? 'btn-fight' : ''}`}
            style={{
              fontSize: '10px',
              padding: '8px 14px',
              background: activeTab === 'teambuilder' ? '#ef4444' : '#1e293b',
              color: '#fff',
              borderColor: activeTab === 'teambuilder' ? '#000' : '#475569'
            }}
          >
            🛠️ TEAMBUILDER
          </button>

          <button
            onClick={() => { sounds.playSelect(); onTabChange('opponents'); }}
            className={`btn-retro ${activeTab === 'opponents' ? 'btn-bag' : ''}`}
            style={{
              fontSize: '10px',
              padding: '8px 14px',
              background: activeTab === 'opponents' ? '#f59e0b' : '#1e293b',
              color: '#fff',
              borderColor: activeTab === 'opponents' ? '#000' : '#475569'
            }}
          >
            🥊 ADVERSÁRIOS
          </button>

          <button
            onClick={() => { sounds.playSelect(); onTabChange('battle'); }}
            className={`btn-retro ${activeTab === 'battle' ? 'btn-pokemon' : ''}`}
            style={{
              fontSize: '10px',
              padding: '8px 14px',
              background: activeTab === 'battle' ? '#10b981' : '#1e293b',
              color: '#fff',
              borderColor: activeTab === 'battle' ? '#000' : '#475569'
            }}
          >
            ⚔️ ARENA GBA
          </button>
        </nav>

        {/* Ações Rápidas: Joy e Mute */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => { sounds.playNurseJoy(); onQuickJoy(); }}
            disabled={joyLoading}
            className="btn-retro"
            style={{
              background: '#ec4899',
              color: '#fff',
              fontSize: '9px',
              padding: '8px 12px'
            }}
            title="Curar time inteiro com a Enfermeira Joy"
          >
            🏥 {joyLoading ? 'Curando...' : 'ENFERMEIRA JOY'}
          </button>

          <button
            onClick={handleMuteToggle}
            className="btn-retro"
            style={{
              background: muted ? '#64748b' : '#3b82f6',
              color: '#fff',
              fontSize: '10px',
              padding: '8px 10px'
            }}
            title={muted ? 'Desmutar sons' : 'Mutar sons'}
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </header>
  );
}
