import React, { useState } from 'react';
import HpBar from './HpBar';
import sounds from '../../services/soundEffects';

export default function BagModal({
  mochila = [],
  timeJogador = [],
  onUseItem,
  onClose,
  disabled = false
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedPokemonId, setSelectedPokemonId] = useState(null);

  const handleConfirm = () => {
    if (!selectedItem || !selectedPokemonId) return;
    sounds.playHeal();
    onUseItem(selectedItem.item_id, selectedPokemonId);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        {/* Cabeçalho do Modal */}
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="retro-text" style={{ fontSize: '13px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🎒 Mochila de Batalha do Treinador
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Passo 1: Selecionar Item */}
          <div>
            <span className="retro-text" style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
              1. Selecione o item que deseja utilizar:
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
              {mochila.filter(it => it.quantidade > 0).map((item) => {
                const isSelected = selectedItem?.item_id === item.item_id;
                return (
                  <button
                    key={item.item_id}
                    onClick={() => { sounds.playSelect(); setSelectedItem(item); }}
                    style={{
                      background: isSelected ? '#1e3a5f' : '#0f172a',
                      border: isSelected ? '2px solid #38bdf8' : '2px solid #334155',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>🧪</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="retro-text" style={{ fontSize: '10px', color: '#f8fafc', fontWeight: 'bold' }}>
                          {item.nome}
                        </span>
                        <span className="retro-text" style={{ fontSize: '9px', color: '#fbbf24', background: '#334155', padding: '2px 5px', borderRadius: '4px' }}>
                          x{item.quantidade}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {item.descricao}
                      </p>
                    </div>
                  </button>
                );
              })}
              {mochila.filter(it => it.quantidade > 0).length === 0 && (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Nenhum item disponível na mochila!
                </div>
              )}
            </div>
          </div>

          {/* Passo 2: Selecionar Alvo */}
          {selectedItem && (
            <div>
              <span className="retro-text" style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
                2. Escolha o Pokémon alvo:
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                {timeJogador.map((pok) => {
                  const isSelected = selectedPokemonId === pok.id;
                  const isRevive = selectedItem.efeito_tipo === 'REVIVE';
                  const isEligible = isRevive ? pok.esta_desmaiado : (!pok.esta_desmaiado && pok.hp_atual < pok.hp_max);

                  return (
                    <button
                      key={pok.id}
                      onClick={() => { sounds.playSelect(); setSelectedPokemonId(pok.id); }}
                      disabled={!isEligible}
                      style={{
                        background: isSelected ? '#1e3a5f' : '#0f172a',
                        border: isSelected ? '2px solid #22c55e' : '2px solid #334155',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        textAlign: 'left',
                        cursor: isEligible ? 'pointer' : 'not-allowed',
                        opacity: isEligible ? 1 : 0.45,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <img
                        src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pok.especie_id}.png`}
                        alt={pok.apelido}
                        className="pixelated"
                        style={{ width: '40px', height: '40px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span className="retro-text" style={{ fontSize: '10px', color: '#f8fafc' }}>
                            {pok.apelido}
                          </span>
                          <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8' }}>
                            Lv. {pok.nivel}
                          </span>
                        </div>
                        <HpBar hpAtual={pok.hp_atual} hpMax={pok.hp_max} showText={true} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Ações */}
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
            disabled={!selectedItem || !selectedPokemonId || disabled}
            className="btn-retro"
            style={{ background: '#22c55e', color: '#fff' }}
          >
            ✨ Usar Item
          </button>
        </div>
      </div>
    </div>
  );
}
