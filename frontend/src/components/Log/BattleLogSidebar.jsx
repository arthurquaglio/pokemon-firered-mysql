import React, { useEffect, useRef } from 'react';

function getBadge(msg) {
  if (!msg) return null;
  const upper = msg.toUpperCase();

  if (upper.includes('SUPER EFETIVO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#15803d', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>SUPER EFETIVO!</span>;
  }
  if (upper.includes('POUCO EFETIVO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#b91c1c', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>POUCO EFETIVO</span>;
  }
  if (upper.includes('CRÍTICO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#c2410c', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>CRÍTICO!</span>;
  }
  if (upper.includes('LEFTOVERS')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>LEFTOVERS</span>;
  }
  if (upper.includes('DESMAIOU')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#000000', color: '#ef4444', border: '1px solid #ef4444', padding: '2px 6px', borderRadius: '4px' }}>DESMAIOU!</span>;
  }
  if (upper.includes('RESTAURADO') || upper.includes('RECUPEROU')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>CURA HP</span>;
  }
  if (upper.includes('PARALISADO') || upper.includes('TOTALMENTE PARALISADO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#ca8a04', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>⚡ PARALISIA</span>;
  }
  if (upper.includes('DORMINDO') || upper.includes('ADORMECIDO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#475569', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>💤 SONO</span>;
  }
  if (upper.includes('ENVENENADO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#9333ea', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>☠️ VENENO</span>;
  }
  if (upper.includes('QUEIMADO') || upper.includes('QUEIMADURA')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#ea580c', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>🔥 QUEIMADURA</span>;
  }
  if (upper.includes('CONGELADO')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#0891b2', color: '#000', padding: '2px 6px', borderRadius: '4px' }}>❄️ CONGELADO</span>;
  }
  if (upper.includes('CHOVENDO') || upper.includes('CHUVA')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#0369a1', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>🌧️ CHUVA</span>;
  }
  if (upper.includes('SOL')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#d97706', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>☀️ SOL</span>;
  }
  if (upper.includes('HABILIDADE')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#4338ca', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>✨ HABILIDADE</span>;
  }
  if (upper.includes('SUBIU') || upper.includes('AUMENTOU')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#166534', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>▲ STATS +</span>;
  }
  if (upper.includes('CAIU') || upper.includes('DIMINUIU')) {
    return <span className="retro-text" style={{ fontSize: '8px', background: '#991b1b', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>▼ STATS -</span>;
  }
  return null;
}

export default function BattleLogSidebar({ logs = [], turnoAtual = 1 }) {
  const bottomRef = useRef(null);

  // Auto-scroll automático sempre que chegar novo log
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className="gba-panel-dark"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '480px',
        overflow: 'hidden'
      }}
    >
      {/* Cabeçalho da Sidebar */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '2px solid #334155',
          background: '#0f172a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📜</span>
          <span className="retro-text" style={{ fontSize: '11px', color: '#38bdf8' }}>
            Log de Batalha
          </span>
        </div>
        <span
          className="retro-text"
          style={{
            fontSize: '9px',
            background: '#1e293b',
            color: '#f59e0b',
            padding: '4px 8px',
            borderRadius: '4px',
            border: '1px solid #475569'
          }}
        >
          Turno {turnoAtual}
        </span>
      </div>

      {/* Conteúdo com rolagem automática */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              padding: '24px 10px',
              textAlign: 'center',
              color: '#64748b',
              fontSize: '12px'
            }}
          >
            Aguardando a primeira ação de combate...
          </div>
        ) : (
          logs.map((log) => {
            const badge = getBadge(log.mensagem);
            return (
              <div
                key={log.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'background 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8' }}>
                    T{log.numero_turno} • Ação {log.ordem_acao}
                  </span>
                  {badge}
                </div>

                <p
                  style={{
                    fontSize: '12px',
                    lineHeight: '1.45',
                    color: '#f1f5f9',
                    wordBreak: 'break-word'
                  }}
                >
                  {log.mensagem}
                </p>

                {log.dano_causado > 0 && (
                  <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#ef4444', fontWeight: 600 }}>
                    <span>💥 Dano: {log.dano_causado}</span>
                    {log.multiplicador_tipo > 1 && <span>(x{log.multiplicador_tipo})</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
