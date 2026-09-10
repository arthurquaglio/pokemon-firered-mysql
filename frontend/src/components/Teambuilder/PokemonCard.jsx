import React from 'react';
import sounds from '../../services/soundEffects';

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

export default function PokemonCard({
  pokemon,
  posicao,
  onOpenPokemonPicker,
  onOpenItemPicker,
  onOpenMovePicker,
  onRemovePokemon
}) {
  if (!pokemon) {
    return (
      <div
        onClick={() => {
          sounds.playSelect();
          onOpenPokemonPicker(posicao);
        }}
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '3px dashed #475569',
          borderRadius: '12px',
          minHeight: '340px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          padding: '20px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#38bdf8';
          e.currentTarget.style.background = 'rgba(30, 58, 138, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#475569';
          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.6)';
        }}
      >
        <span style={{ fontSize: '36px', marginBottom: '8px' }}>➕</span>
        <span className="retro-text" style={{ fontSize: '11px', color: '#38bdf8', textAlign: 'center' }}>
          SLOT #{posicao}
        </span>
        <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
          Clique para adicionar Pokémon
        </span>
      </div>
    );
  }

  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.especie_id}.png`;

  return (
    <div
      className="gba-panel-dark"
      style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative'
      }}
    >
      {/* Cabeçalho do Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className="retro-text"
            style={{
              fontSize: '9px',
              background: '#ef4444',
              color: '#fff',
              padding: '3px 6px',
              borderRadius: '4px'
            }}
          >
            #{posicao}
          </span>
          <span className="retro-text" style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }}>
            {pokemon.apelido}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="retro-text" style={{ fontSize: '9px', color: '#fbbf24' }}>
            Lv. {pokemon.nivel}
          </span>
          <button
            onClick={() => {
              if (window.confirm(`Remover ${pokemon.apelido} do time?`)) {
                onRemovePokemon(pokemon.id);
              }
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px'
            }}
            title="Remover do time"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Sprite e Tipos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          onClick={() => {
            sounds.playPokemonCry(pokemon.especie_id);
            onOpenPokemonPicker(posicao);
          }}
          style={{ cursor: 'pointer', position: 'relative' }}
          title="Clique para trocar de espécie"
        >
          <img
            src={spriteUrl}
            alt={pokemon.apelido}
            className="pixelated"
            style={{ width: '80px', height: '80px' }}
          />
          <span
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: 'rgba(0,0,0,0.7)',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '9px'
            }}
          >
            🔄
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            {pokemon.tipo1_nome && (
              <span className={`type-badge ${typeClassMap[pokemon.tipo1_nome] || 'type-normal'}`}>
                {pokemon.tipo1_nome}
              </span>
            )}
            {pokemon.tipo2_nome && (
              <span className={`type-badge ${typeClassMap[pokemon.tipo2_nome] || 'type-normal'}`}>
                {pokemon.tipo2_nome}
              </span>
            )}
          </div>

          {/* Atributos Principais */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', color: '#cbd5e1' }}>
            <span>HP: <strong>{pokemon.hp_max}</strong></span>
            <span>ATK: <strong>{pokemon.ataque}</strong></span>
            <span>DEF: <strong>{pokemon.defesa}</strong></span>
            <span>SPD: <strong>{pokemon.velocidade}</strong></span>
          </div>
        </div>
      </div>

      {/* Held Item */}
      <div style={{ borderTop: '1px solid #334155', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8' }}>
            HELD ITEM:
          </span>
        </div>
        <button
          onClick={() => {
            sounds.playSelect();
            onOpenItemPicker(pokemon);
          }}
          style={{
            width: '100%',
            padding: '7px 10px',
            background: pokemon.held_item_id ? '#172554' : '#0f172a',
            border: pokemon.held_item_id ? '2px solid #38bdf8' : '2px dashed #475569',
            borderRadius: '6px',
            color: pokemon.held_item_id ? '#38bdf8' : '#64748b',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <span>{pokemon.held_item_id ? '🎒' : '➕'}</span>
          <span className="retro-text" style={{ fontSize: '9px', fontWeight: 'bold' }}>
            {pokemon.held_item_nome || 'Nenhum Item (Clique para Equipar)'}
          </span>
        </button>
      </div>

      {/* 4 Movimentos / Golpes */}
      <div style={{ borderTop: '1px solid #334155', paddingTop: '10px' }}>
        <span className="retro-text" style={{ fontSize: '8px', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
          GOLPES ATIVOS (Clique para alterar):
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {(pokemon.movimentos || []).map((mov, index) => {
            const typeClass = typeClassMap[mov.tipo_nome] || 'type-normal';
            return (
              <button
                key={mov.movimento_id || index}
                onClick={() => {
                  sounds.playSelect();
                  onOpenMovePicker(pokemon, mov);
                }}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '44px',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#22c55e')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="retro-text" style={{ fontSize: '9px', color: '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mov.nome}
                  </span>
                  <span className={`type-badge ${typeClass}`} style={{ fontSize: '6px', padding: '1px 3px' }}>
                    {mov.tipo_nome}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginTop: '2px' }}>
                  <span>PP {mov.pp_atual}/{mov.pp_maximo}</span>
                  <span>{mov.poder > 0 ? `P:${mov.poder}` : 'Status'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
