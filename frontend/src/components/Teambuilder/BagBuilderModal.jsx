import React from 'react';
import sounds from '../../services/soundEffects';

export default function BagBuilderModal({
  mochila = [],
  onUpdateQuantity,
  onClose
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '580px' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="retro-text" style={{ fontSize: '13px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎒 Mochila do Treinador (Bag Builder)
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Ajuste as quantidades de itens de combate que você levará para as batalhas
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mochila.map((item) => (
            <div
              key={item.item_id}
              style={{
                background: '#0f172a',
                border: '2px solid #334155',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🧪</span>
                <div>
                  <span className="retro-text" style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }}>
                    {item.nome}
                  </span>
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    {item.descricao}
                  </p>
                </div>
              </div>

              {/* Controles de Quantidade + / - */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    sounds.playSelect();
                    onUpdateQuantity(item.item_id, Math.max(0, item.quantidade - 1));
                  }}
                  className="btn-retro"
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    padding: '6px 10px',
                    fontSize: '12px',
                    minWidth: '32px'
                  }}
                >
                  -
                </button>

                <span
                  className="retro-text"
                  style={{
                    fontSize: '12px',
                    color: '#fbbf24',
                    minWidth: '36px',
                    textAlign: 'center'
                  }}
                >
                  {item.quantidade}
                </span>

                <button
                  onClick={() => {
                    sounds.playSelect();
                    onUpdateQuantity(item.item_id, item.quantidade + 1);
                  }}
                  className="btn-retro"
                  style={{
                    background: '#22c55e',
                    color: '#fff',
                    padding: '6px 10px',
                    fontSize: '12px',
                    minWidth: '32px'
                  }}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 20px', borderTop: '2px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-retro" style={{ background: '#3b82f6', color: '#fff' }}>
            Pronto
          </button>
        </div>
      </div>
    </div>
  );
}
