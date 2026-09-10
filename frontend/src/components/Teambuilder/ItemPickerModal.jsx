import React from 'react';
import sounds from '../../services/soundEffects';

export default function ItemPickerModal({
  heldItems = [],
  currentItemId = null,
  pokemonNome = 'Pokémon',
  onEquipItem,
  onRemoveItem,
  onClose
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="retro-text" style={{ fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🎒 Equipar Held Item para {pokemonNome}
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Itens segurados concedem efeitos passivos durante a batalha (ex: regeneração, bônus de tipo)
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '55vh', overflowY: 'auto' }}>
          {/* Opção de Remover Item */}
          {currentItemId && (
            <button
              onClick={() => {
                sounds.playSelect();
                onRemoveItem();
                onClose();
              }}
              style={{
                background: '#450a0a',
                border: '2px dashed #ef4444',
                borderRadius: '8px',
                padding: '12px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '20px' }}>❌</span>
              <div>
                <span className="retro-text" style={{ fontSize: '11px', color: '#fca5a5' }}>
                  Remover Item Segurado Atual
                </span>
                <p style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>
                  Deixa o Pokémon sem nenhum item equipado.
                </p>
              </div>
            </button>
          )}

          {/* Lista de Held Items */}
          {heldItems.map((item) => {
            const isEquipped = item.id === currentItemId;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playSelect();
                  onEquipItem(item.id);
                  onClose();
                }}
                style={{
                  background: isEquipped ? '#172554' : '#0f172a',
                  border: isEquipped ? '2px solid #38bdf8' : '2px solid #334155',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isEquipped) e.currentTarget.style.borderColor = '#38bdf8';
                }}
                onMouseLeave={(e) => {
                  if (!isEquipped) e.currentTarget.style.borderColor = '#334155';
                }}
              >
                <span style={{ fontSize: '24px' }}>
                  {item.efeito_tipo === 'REGENERACAO_TURNO' ? '🍎' :
                   item.efeito_tipo === 'BOOST_DANO_TIPO' ? '⚡' :
                   item.efeito_tipo === 'BOOST_STAT' ? '🥋' : '🛡️'}
                </span>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="retro-text" style={{ fontSize: '11px', color: isEquipped ? '#38bdf8' : '#f8fafc', fontWeight: 'bold' }}>
                      {item.nome}
                    </span>
                    {isEquipped && (
                      <span className="retro-text" style={{ fontSize: '8px', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>
                        EQUIPADO
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                    {item.descricao}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '2px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-retro" style={{ background: '#64748b', color: '#fff' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
