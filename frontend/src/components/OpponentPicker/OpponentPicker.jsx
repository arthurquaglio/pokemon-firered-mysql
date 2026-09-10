import React, { useState, useEffect } from 'react';
import { getTreinadores } from '../../services/api';
import sounds from '../../services/soundEffects';

const trainerPortraits = {
  Blue: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/blue.png',
  Brock: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/brock.png',
  Misty: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/misty.png',
  'Lt. Surge': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/lt-surge.png'
};

const trainerThemes = {
  Blue: { badge: 'Campeão da Liga', color: '#3b82f6', bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)' },
  Brock: { badge: 'Insígnia de Pedra', color: '#b45309', bgGradient: 'linear-gradient(135deg, #78350f 0%, #1c1917 100%)' },
  Misty: { badge: 'Insígnia da Cascata', color: '#0284c7', bgGradient: 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)' },
  'Lt. Surge': { badge: 'Insígnia do Trovão', color: '#eab308', bgGradient: 'linear-gradient(135deg, #a16207 0%, #1c1917 100%)' }
};

export default function OpponentPicker({ onSelectOpponent, onStartBattle, loading = false }) {
  const [treinadores, setTreinadores] = useState([]);
  const [selectedId, setSelectedId] = useState(2); // Blue default
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setFetching(true);
        const res = await getTreinadores();
        if (res.sucesso) {
          // Filtrar apenas oponentes (não é o jogador)
          const oponentes = res.dados.filter((t) => !t.eh_jogador);
          setTreinadores(oponentes);
          if (oponentes.length > 0) {
            setSelectedId(oponentes[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar oponentes:', err);
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  const handleSelect = (id) => {
    sounds.playSelect();
    setSelectedId(id);
  };

  const handleStart = () => {
    sounds.playAttackHit();
    onStartBattle(selectedId, true);
  };

  const handleRandomMatch = () => {
    if (treinadores.length === 0) return;
    sounds.playSuperEffective();
    const randomIndex = Math.floor(Math.random() * treinadores.length);
    const chosen = treinadores[randomIndex];
    setSelectedId(chosen.id);
    onStartBattle(chosen.id, true);
  };

  const selectedOpponent = treinadores.find((t) => t.id === selectedId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Barra Superior */}
      <div
        className="gba-panel-dark"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <h2 className="retro-text" style={{ fontSize: '14px', color: '#38bdf8', marginBottom: '4px' }}>
            🥊 Seleção de Adversários Oficiais
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Escolha um Líder de Ginásio, o Rival Campeão ou encare uma Batalha Rápida aleatória.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleRandomMatch}
            disabled={loading || fetching}
            className="btn-retro btn-bag"
            style={{ fontSize: '11px' }}
          >
            🎲 BATALHA RÁPIDA (RANDOM)
          </button>

          <button
            onClick={handleStart}
            disabled={loading || fetching || !selectedId}
            className="btn-retro btn-fight"
            style={{ fontSize: '11px' }}
          >
            ⚔️ DESAFIAR PARA BATALHA!
          </button>
        </div>
      </div>

      {/* Grid de Treinadores */}
      {fetching ? (
        <div className="gba-panel-dark" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
          Carregando lista de treinadores...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px'
          }}
        >
          {treinadores.map((t) => {
            const isSelected = t.id === selectedId;
            const theme = trainerThemes[t.nome] || {
              badge: t.classe,
              color: '#3b82f6',
              bgGradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
            };
            const portrait = trainerPortraits[t.nome] || 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

            return (
              <div
                key={t.id}
                onClick={() => handleSelect(t.id)}
                style={{
                  background: theme.bgGradient,
                  border: isSelected ? `3px solid ${theme.color}` : '3px solid #334155',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? `0 0 20px ${theme.color}40` : 'none',
                  transform: isSelected ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Cabeçalho do Treinador */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <span
                        className="retro-text"
                        style={{
                          fontSize: '8px',
                          background: theme.color,
                          color: '#fff',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          textShadow: '1px 1px 0 #000'
                        }}
                      >
                        {theme.badge}
                      </span>
                      <h3 className="retro-text" style={{ fontSize: '13px', color: '#f8fafc', marginTop: '6px' }}>
                        {t.nome}
                      </h3>
                      <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        {t.classe}
                      </span>
                    </div>

                    <img
                      src={portrait}
                      alt={t.nome}
                      className="pixelated"
                      style={{
                        width: '56px',
                        height: '56px',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Lista de Pokémons do Treinador */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
                    <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                      EQUIPE ({t.pokemons?.length || 0} POKÉMONS):
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                      {(t.pokemons || []).map((pok) => (
                        <div
                          key={pok.id}
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center'
                          }}
                        >
                          <img
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pok.especie_id}.png`}
                            alt={pok.especie_nome}
                            className="pixelated"
                            style={{ width: '40px', height: '40px' }}
                          />
                          <span
                            className="retro-text"
                            style={{
                              fontSize: '8px',
                              color: '#f8fafc',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              width: '100%'
                            }}
                          >
                            {pok.especie_nome}
                          </span>
                          <span style={{ fontSize: '9px', color: '#fbbf24' }}>
                            Lv.{pok.nivel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botão Selecionar */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(t.id);
                    handleStart();
                  }}
                  className="btn-retro"
                  style={{
                    marginTop: '16px',
                    width: '100%',
                    background: isSelected ? '#ef4444' : '#1e293b',
                    color: '#fff',
                    fontSize: '9px',
                    borderColor: isSelected ? '#000' : '#475569'
                  }}
                >
                  {isSelected ? '⚔️ DESAFIAR AGORA!' : 'SELECIONAR'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
