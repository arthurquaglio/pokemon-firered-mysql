import React from 'react';

const typeClassMap = {
  Normal: 'type-normal',
  Fogo: 'type-fogo',
  Água: 'type-agua',
  Planta: 'type-planta',
  Elétrico: 'type-eletrico',
  Gelo: 'type-gelo',
  Lutador: 'type-lutador',
  Venenoso: 'type-venenoso',
  Terra: 'type-terra',
  Voador: 'type-voador',
  Psíquico: 'type-psiquico',
  Inseto: 'type-inseto',
  Pedra: 'type-pedra',
  Fantasma: 'type-fantasma',
  Dragão: 'type-dragao',
  Aço: 'type-aco',
  Noturno: 'type-noturno'
};

export default function MovesGrid({ movimentos = [], onSelectMove, onBack, disabled = false }) {
  // Preencher até 4 slots
  const movesSlots = [...movimentos];
  while (movesSlots.length < 4) {
    movesSlots.push(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', flex: 1 }}>
        {movesSlots.map((mov, index) => {
          if (!mov) {
            return (
              <div
                key={`empty-${index}`}
                style={{
                  background: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#94a3b8',
                  fontSize: '10px'
                }}
                className="retro-text"
              >
                -
              </div>
            );
          }

          const semPP = mov.pp_atual <= 0;
          const typeClass = typeClassMap[mov.tipo_nome] || 'type-normal';

          return (
            <button
              key={mov.movimento_id || index}
              onClick={() => !disabled && !semPP && onSelectMove(mov.movimento_id)}
              disabled={disabled || semPP}
              style={{
                background: semPP ? '#e2e8f0' : '#ffffff',
                border: '3px solid #1e293b',
                borderRadius: '8px',
                padding: '8px 10px',
                textAlign: 'left',
                cursor: semPP || disabled ? 'not-allowed' : 'pointer',
                opacity: semPP ? 0.6 : 1,
                boxShadow: semPP ? 'none' : '0 3px 0 #1e293b',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!semPP && !disabled) e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                if (!semPP && !disabled) e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span
                  className="retro-text"
                  style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: semPP ? '#94a3b8' : '#0f172a'
                  }}
                >
                  {mov.nome}
                </span>
                <span className={`type-badge ${typeClass}`} style={{ fontSize: '8px', padding: '2px 5px' }}>
                  {mov.tipo_nome}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  className="retro-text"
                  style={{
                    fontSize: '9px',
                    color: mov.pp_atual <= 3 ? '#ef4444' : '#475569',
                    fontWeight: 'bold'
                  }}
                >
                  PP {mov.pp_atual}/{mov.pp_maximo}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                  {mov.poder > 0 ? `PODER: ${mov.poder}` : mov.categoria}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={onBack}
          disabled={disabled}
          className="btn-retro"
          style={{
            background: '#64748b',
            color: '#fff',
            fontSize: '9px',
            padding: '6px 14px'
          }}
        >
          ⬅️ VOLTAR
        </button>
      </div>
    </div>
  );
}
