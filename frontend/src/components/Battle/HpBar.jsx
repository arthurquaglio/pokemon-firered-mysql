import React from 'react';

export default function HpBar({ hpAtual = 0, hpMax = 1, showText = true, label = 'HP' }) {
  const safeHpAtual = Math.max(0, hpAtual);
  const safeHpMax = Math.max(1, hpMax);
  const percentage = Math.min(100, Math.round((safeHpAtual / safeHpMax) * 100));

  let colorClass = 'hp-high';
  if (percentage <= 20) {
    colorClass = 'hp-low';
  } else if (percentage <= 50) {
    colorClass = 'hp-medium';
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
        <span
          className="retro-text"
          style={{
            fontSize: '9px',
            fontWeight: 'bold',
            color: '#eab308',
            backgroundColor: '#1e293b',
            padding: '2px 4px',
            borderRadius: '3px'
          }}
        >
          {label}
        </span>
        <div className="hp-bar-container">
          <div
            className={`hp-bar-fill ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      {showText && (
        <div
          className="retro-text"
          style={{
            fontSize: '9px',
            textAlign: 'right',
            color: '#334155',
            fontWeight: 'bold'
          }}
        >
          {safeHpAtual}/{safeHpMax}
        </div>
      )}
    </div>
  );
}
