import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import sounds from '../../services/soundEffects';

export default function BattleResultModal({
  status,
  oponenteNome,
  onRematch,
  onBackToBuilder
}) {
  const isVictory = status === 'VITORIA_JOGADOR';

  useEffect(() => {
    if (isVictory) {
      sounds.playVictory();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 }
      });
    } else {
      sounds.playFaint();
    }
  }, [isVictory]);

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          textAlign: 'center',
          padding: '30px 24px',
          border: isVictory ? '4px solid #22c55e' : '4px solid #ef4444'
        }}
      >
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>
          {isVictory ? '🏆' : '💀'}
        </div>

        <h2
          className="retro-text"
          style={{
            fontSize: '18px',
            color: isVictory ? '#22c55e' : '#ef4444',
            marginBottom: '12px'
          }}
        >
          {isVictory ? 'VITÓRIA ÉPICA!' : 'FIM DA BATALHA'}
        </h2>

        <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', marginBottom: '24px' }}>
          {isVictory ? (
            <>
              Parabéns! Você derrotou todos os Pokémons de <strong>{oponenteNome || 'seu oponente'}</strong> e conquistou a glória na Liga Pokémon!
            </>
          ) : (
            <>
              Todos os seus Pokémons foram derrotados por <strong>{oponenteNome || 'seu oponente'}</strong>! Você correu para o Centro Pokémon mais próximo.
            </>
          )}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={onRematch}
            className="btn-retro btn-fight"
            style={{ fontSize: '11px', padding: '12px 20px' }}
          >
            ⚔️ REVANCHE
          </button>

          <button
            onClick={onBackToBuilder}
            className="btn-retro btn-pokemon"
            style={{ fontSize: '11px', padding: '12px 20px' }}
          >
            🛠️ TEAMBUILDER
          </button>
        </div>
      </div>
    </div>
  );
}
