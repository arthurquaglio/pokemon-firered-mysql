import React, { useState } from 'react';
import MovesGrid from './MovesGrid';
import sounds from '../../services/soundEffects';

export default function BattleMenu({
  pokemonJogador,
  onSelectMove,
  onOpenBag,
  onOpenPokemon,
  onRun,
  disabled = false
}) {
  const [showMoves, setShowMoves] = useState(false);

  const handleFightClick = () => {
    sounds.playSelect();
    setShowMoves(true);
  };

  const handleBackClick = () => {
    sounds.playSelect();
    setShowMoves(false);
  };

  const handleMoveChosen = (movimentoId) => {
    sounds.playSelect();
    setShowMoves(false);
    onSelectMove(movimentoId);
  };

  return (
    <div
      className="gba-box"
      style={{
        padding: '12px',
        height: '150px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      {showMoves ? (
        <MovesGrid
          movimentos={pokemonJogador?.movimentos || []}
          onSelectMove={handleMoveChosen}
          onBack={handleBackClick}
          disabled={disabled}
        />
      ) : (
        <div style={{ display: 'flex', height: '100%', gap: '12px' }}>
          {/* Caixa de Texto Clássica GBA */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              padding: '8px 14px',
              background: '#f8fafc',
              border: '2px solid #cbd5e1',
              borderRadius: '6px'
            }}
          >
            <p
              className="retro-text"
              style={{
                fontSize: '11px',
                lineHeight: '1.6',
                color: '#0f172a'
              }}
            >
              O que <span style={{ color: '#ef4444' }}>{pokemonJogador?.apelido || 'seu Pokémon'}</span> vai fazer?
            </p>
          </div>

          {/* Grade dos 4 Botões GBA */}
          <div
            style={{
              width: '260px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px'
            }}
          >
            <button
              onClick={handleFightClick}
              disabled={disabled}
              className="btn-retro btn-fight"
              style={{ fontSize: '11px' }}
            >
              ⚔️ FIGHT
            </button>

            <button
              onClick={() => { sounds.playSelect(); onOpenBag(); }}
              disabled={disabled}
              className="btn-retro btn-bag"
              style={{ fontSize: '11px' }}
            >
              🎒 BAG
            </button>

            <button
              onClick={() => { sounds.playSelect(); onOpenPokemon(); }}
              disabled={disabled}
              className="btn-retro btn-pokemon"
              style={{ fontSize: '11px' }}
            >
              🔄 PKMN
            </button>

            <button
              onClick={() => { sounds.playSelect(); onRun(); }}
              disabled={disabled}
              className="btn-retro btn-run"
              style={{ fontSize: '11px' }}
            >
              🏃 RUN
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
