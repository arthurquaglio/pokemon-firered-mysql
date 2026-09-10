import React, { useState } from 'react';
import sounds from '../../services/soundEffects';
import { TYPE_TRANSLATION_PT_EN, getTypeClass, formatTypeName } from '../../utils/typeHelper';

const typesList = [
  'Todos', 'Normal', 'Fogo', 'Água', 'Planta', 'Elétrico', 'Gelo', 
  'Lutador', 'Venenoso', 'Terra', 'Voador', 'Psíquico', 'Inseto', 
  'Pedra', 'Fantasma', 'Dragão', 'Aço'
];

export default function PokemonPickerModal({ pokedex = [], onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');

  const filtered = pokedex.filter((p) => {
    const matchesSearch = p.nome.toLowerCase().includes(search.toLowerCase()) ||
                          p.id_pokedex.toString().includes(search);
    const enType = TYPE_TRANSLATION_PT_EN[selectedType] || selectedType;
    const t1 = p.tipo1 || p.tipo1_nome;
    const t2 = p.tipo2 || p.tipo2_nome;
    const matchesType = selectedType === 'Todos' ||
                        t1 === selectedType || t1 === enType ||
                        t2 === selectedType || t2 === enType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '820px', maxHeight: '88vh' }}
      >
        {/* Cabeçalho */}
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="retro-text" style={{ fontSize: '13px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔴 Escolha um Pokémon de Kanto (1 - 151)
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Selecione uma espécie para integrar sua equipe de combate
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Barra de Busca e Filtro de Tipos */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nome ou número (#001)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#0f172a',
              border: '2px solid #475569',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none'
            }}
          />

          {/* Filtro de Tipos */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
            {typesList.map((t) => {
              const active = selectedType === t;
              return (
                <button
                  key={t}
                  onClick={() => { sounds.playSelect(); setSelectedType(t); }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    background: active ? '#ef4444' : '#1e293b',
                    color: '#fff',
                    border: active ? '2px solid #fff' : '1px solid #475569',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid de Pokémons */}
        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            maxHeight: '52vh',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px'
          }}
        >
          {filtered.map((pok) => {
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pok.id_pokedex}.png`;
            const t1 = pok.tipo1 || pok.tipo1_nome;
            const t2 = pok.tipo2 || pok.tipo2_nome;
            return (
              <button
                key={pok.id_pokedex}
                onClick={() => {
                  sounds.playSelect();
                  onSelect(pok);
                  onClose();
                }}
                style={{
                  background: '#0f172a',
                  border: '2px solid #334155',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 6px 15px rgba(239, 68, 68, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = '#334155';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  className="retro-text"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    fontSize: '8px',
                    color: '#64748b'
                  }}
                >
                  #{String(pok.id_pokedex).padStart(3, '0')}
                </span>

                <img
                  src={spriteUrl}
                  alt={pok.nome}
                  className="pixelated"
                  style={{ width: '64px', height: '64px', marginTop: '4px' }}
                />

                <span
                  className="retro-text"
                  style={{
                    fontSize: '10px',
                    color: '#f8fafc',
                    marginTop: '4px',
                    textAlign: 'center'
                  }}
                >
                  {pok.nome}
                </span>

                <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                  {t1 && (
                    <span className={`type-badge ${getTypeClass(t1)}`} style={{ fontSize: '7px', padding: '2px 4px' }}>
                      {formatTypeName(t1)}
                    </span>
                  )}
                  {t2 && (
                    <span className={`type-badge ${getTypeClass(t2)}`} style={{ fontSize: '7px', padding: '2px 4px' }}>
                      {formatTypeName(t2)}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '10px',
                    color: '#94a3b8',
                    marginTop: '6px',
                    display: 'flex',
                    gap: '6px'
                  }}
                >
                  <span>HP:{pok.hp_base}</span>
                  <span>ATK:{pok.ataque_base}</span>
                  <span>SPD:{pok.velocidade_base}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Rodapé */}
        <div style={{ padding: '12px 20px', borderTop: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {filtered.length} Pokémons encontrados
          </span>
          <button onClick={onClose} className="btn-retro" style={{ background: '#64748b', color: '#fff' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
