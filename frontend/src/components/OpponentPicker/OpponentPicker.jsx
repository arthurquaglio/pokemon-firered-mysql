import React, { useState, useEffect } from 'react';
import { getTreinadores } from '../../services/api';
import sounds from '../../services/soundEffects';

const trainerPortraits = {
  Blue: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/blue.png',
  Brock: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/brock.png',
  Misty: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/misty.png',
  'Lt. Surge': 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/lt-surge.png',
  Erika: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/erika.png',
  Koga: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/koga.png',
  Sabrina: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/sabrina.png',
  Blaine: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/blaine.png',
  Giovanni: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/giovanni.png',
  Lorelei: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/lorelei.png',
  Bruno: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/bruno.png',
  Agatha: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/agatha.png',
  Lance: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/lance.png'
};

const trainerThemes = {
  Blue: { badge: 'Campeão da Liga', color: '#3b82f6', bgGradient: 'linear-gradient(135deg, #1e3a8a 0%, #1e1b4b 100%)', cat: 'campeao' },
  Brock: { badge: 'Líder 1 • Pedra', color: '#b45309', bgGradient: 'linear-gradient(135deg, #78350f 0%, #1c1917 100%)', cat: 'ginasio' },
  Misty: { badge: 'Líder 2 • Água', color: '#0284c7', bgGradient: 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)', cat: 'ginasio' },
  'Lt. Surge': { badge: 'Líder 3 • Elétrico', color: '#eab308', bgGradient: 'linear-gradient(135deg, #a16207 0%, #1c1917 100%)', cat: 'ginasio' },
  Erika: { badge: 'Líder 4 • Planta', color: '#16a34a', bgGradient: 'linear-gradient(135deg, #14532d 0%, #052e16 100%)', cat: 'ginasio' },
  Koga: { badge: 'Líder 5 • Veneno', color: '#9333ea', bgGradient: 'linear-gradient(135deg, #581c87 0%, #1e1b4b 100%)', cat: 'ginasio' },
  Sabrina: { badge: 'Líder 6 • Psíquico', color: '#ec4899', bgGradient: 'linear-gradient(135deg, #831843 0%, #1e1b4b 100%)', cat: 'ginasio' },
  Blaine: { badge: 'Líder 7 • Fogo', color: '#ea580c', bgGradient: 'linear-gradient(135deg, #7c2d12 0%, #1c1917 100%)', cat: 'ginasio' },
  Giovanni: { badge: 'Líder 8 • Terra', color: '#78716c', bgGradient: 'linear-gradient(135deg, #292524 0%, #0c0a09 100%)', cat: 'ginasio' },
  Lorelei: { badge: 'Elite 1 • Gelo', color: '#38bdf8', bgGradient: 'linear-gradient(135deg, #075985 0%, #0f172a 100%)', cat: 'elite' },
  Bruno: { badge: 'Elite 2 • Lutador', color: '#dc2626', bgGradient: 'linear-gradient(135deg, #7f1d1d 0%, #18181b 100%)', cat: 'elite' },
  Agatha: { badge: 'Elite 3 • Fantasma', color: '#6b21a8', bgGradient: 'linear-gradient(135deg, #3b0764 0%, #0f172a 100%)', cat: 'elite' },
  Lance: { badge: 'Elite 4 • Dragão', color: '#f43f5e', bgGradient: 'linear-gradient(135deg, #881337 0%, #1e1b4b 100%)', cat: 'elite' }
};

export default function OpponentPicker({
  onSelectOpponent,
  onStartBattle,
  onEditTeam,
  loading = false
}) {
  const [treinadores, setTreinadores] = useState([]);
  const [selectedId, setSelectedId] = useState(2); // Blue default
  const [categoria, setCategoria] = useState('todos'); // 'todos' | 'ginasio' | 'elite' | 'campeao'
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setFetching(true);
        const res = await getTreinadores();
        if (res.sucesso) {
          const oponentes = res.dados.filter((t) => !t.eh_jogador);
          setTreinadores(oponentes);
          if (oponentes.length > 0 && !oponentes.some(o => o.id === selectedId)) {
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

  const handleStart = (idToStart = selectedId) => {
    sounds.playAttackHit();
    onStartBattle(idToStart, true);
  };

  const handleRandomMatch = () => {
    if (treinadores.length === 0) return;
    sounds.playSuperEffective();
    const randomIndex = Math.floor(Math.random() * treinadores.length);
    const chosen = treinadores[randomIndex];
    setSelectedId(chosen.id);
    handleStart(chosen.id);
  };

  const filteredTreinadores = treinadores.filter((t) => {
    if (categoria === 'todos') return true;
    const theme = trainerThemes[t.nome];
    return theme?.cat === categoria;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra Superior */}
      <div
        className="gba-panel-dark"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h2 className="retro-text" style={{ fontSize: '14px', color: '#38bdf8', marginBottom: '4px' }}>
            🥊 Adversários Oficiais de Kanto ({treinadores.length} Treinadores)
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Encare os 8 Líderes de Ginásio, a Elite dos Quatro e o Campeão Blue, ou personalize a equipe deles!
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleRandomMatch}
            disabled={loading || fetching}
            className="btn-retro btn-bag"
            style={{ fontSize: '11px' }}
          >
            🎲 BATALHA RÁPIDA (RANDOM)
          </button>

          <button
            onClick={() => handleStart(selectedId)}
            disabled={loading || fetching || !selectedId}
            className="btn-retro btn-fight"
            style={{ fontSize: '11px' }}
          >
            ⚔️ DESAFIAR SELECIONADO!
          </button>
        </div>
      </div>

      {/* Filtros de Categoria */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { key: 'todos', label: `Todos (${treinadores.length})` },
          { key: 'ginasio', label: 'Líderes de Ginásio (1 a 8)' },
          { key: 'elite', label: 'Elite dos Quatro (1 a 4)' },
          { key: 'campeao', label: 'Campeão da Liga' }
        ].map((cat) => {
          const isActive = categoria === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => { sounds.playSelect(); setCategoria(cat.key); }}
              className={`btn-retro ${isActive ? 'btn-fight' : ''}`}
              style={{
                fontSize: '10px',
                padding: '8px 14px',
                background: isActive ? '#ef4444' : '#1e293b',
                color: '#fff',
                borderColor: isActive ? '#000' : '#475569'
              }}
            >
              {cat.label}
            </button>
          );
        })}
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredTreinadores.map((t) => {
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
                  boxShadow: isSelected ? `0 0 22px ${theme.color}50` : 'none',
                  transform: isSelected ? 'translateY(-3px)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Cabeçalho do Card */}
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

                  {/* Equipe do Treinador */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
                    <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                      EQUIPE ({t.pokemons?.length || 0} POKÉMONS):
                    </span>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))', gap: '6px' }}>
                      {(t.pokemons || []).map((pok) => (
                        <div
                          key={pok.id}
                          style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            padding: '6px 4px',
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
                              fontSize: '7px',
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
                          <span style={{ fontSize: '8px', color: '#fbbf24' }}>
                            Lv.{pok.nivel}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação do Card */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sounds.playSelect();
                      if (onEditTeam) onEditTeam(t.id);
                    }}
                    className="btn-retro"
                    style={{
                      background: '#3b82f6',
                      color: '#fff',
                      fontSize: '9px',
                      padding: '8px'
                    }}
                  >
                    🛠️ EDITAR TIME
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(t.id);
                      handleStart(t.id);
                    }}
                    className="btn-retro"
                    style={{
                      background: isSelected ? '#ef4444' : '#1e293b',
                      color: '#fff',
                      fontSize: '9px',
                      padding: '8px'
                    }}
                  >
                    ⚔️ DESAFIAR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
