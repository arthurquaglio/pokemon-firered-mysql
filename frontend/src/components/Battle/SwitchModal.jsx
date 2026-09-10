import React, { useState } from 'react';
import HpBar from './HpBar';
import sounds from '../../services/soundEffects';

export default function SwitchModal({
  timeJogador = [],
  pokemonAtivoId,
  onSwitchPokemon,
  onClose,
  disabled = false
}) {
  const [selectedPokemonId, setSelectedPokemonId] = useState(null);

  const handleConfirm = () => {
    if (!selectedPokemonId || selectedPokemonId === pokemonAtivoId) return;
    sounds.playSelect();
    onSwitchPokemon(selectedPokemonId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="retro-text" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔄 Escolha um Pokémon para entrar em batalha
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
            ⚠️ Atenção: Trocar de Pokémon consome sua ação no turno e o oponente atacará o novo Pokémon!
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px' }}>
            {timeJogador.map((pok) => {
              const isEmCampo = pok.id === pokemonAtivoId;
              const isDesmaiado = pok.esta_desmaiado || pok.hp_atual <= 0;
              const isSelected = selectedPokemonId === pok.id;
              const canSelect = !isEmCampo && !isDesmaiado;

              return (
                <button
                  key={pok.id}
                  onClick={() => {
                    if (canSelect) {
                      sounds.playSelect();
                      setSelectedPokemonId(pok.id);
                    }
                  }}
                  disabled={!canSelect}
                  style={{
                    background: isSelected ? '#14532d' : isEmCampo ? '#1e293b' : '#0f172a',
                    border: isSelected ? '2px solid #22c55e' : isEmCampo ? '2px solid #eab308' : '2px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    textAlign: 'left',
                    cursor: canSelect ? 'pointer' : 'not-allowed',
                    opacity: isDesmaiado ? 0.4 : isEmCampo ? 0.75 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    position: 'relative'
                  }}
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pok.especie_id}.png`}
                    alt={pok.apelido}
                    className="pixelated"
                    style={{ width: '48px', height: '48px' }}
                  />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span className="retro-text" style={{ fontSize: '10px', color: '#f8fafc', fontWeight: 'bold' }}>
                        {pok.apelido}
                      </span>
                      <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8' }}>
                        Lv. {pok.nivel}
                      </span>
                    </div>

                    <HpBar hpAtual={pok.hp_atual} hpMax={pok.hp_max} showText={true} />

                    {isEmCampo && (
                      <span className="retro-text" style={{ fontSize: '8px', color: '#eab308', display: 'block', marginTop: '4px' }}>
                        ★ EM CAMPO
                      </span>
                    )}

                    {isDesmaiado && (
                      <span className="retro-text" style={{ fontSize: '8px', color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        ✖ DESMAIADO
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '16px 20px', borderTop: '2px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={onClose}
            className="btn-retro"
            style={{ background: '#64748b', color: '#fff' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedPokemonId || disabled}
            className="btn-retro"
            style={{ background: '#10b981', color: '#fff' }}
          >
            🔄 Trocar Pokémon
          </button>
        </div>
      </div>
    </div>
  );
}
