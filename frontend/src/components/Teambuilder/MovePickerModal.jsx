import React, { useState, useEffect } from 'react';
import { getMovimentosEspecie } from '../../services/api';
import sounds from '../../services/soundEffects';
import { getTypeClass } from '../../utils/typeHelper';

export default function MovePickerModal({
  pokemon,
  movimentoAtual,
  onSelectMove,
  onClose
}) {
  const [movimentos, setMovimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadMoves() {
      if (!pokemon?.especie_id) return;
      try {
        setLoading(true);
        const res = await getMovimentosEspecie(pokemon.especie_id);
        if (res.sucesso) {
          // Filtrar movimentos que o pokémon pode aprender até o nível atual
          const compativeis = res.dados.filter(
            (m) => m.nivel_aprendizado <= (pokemon.nivel || 50)
          );
          setMovimentos(compativeis);
        }
      } catch (err) {
        console.error('Erro ao carregar movimentos compatíveis:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMoves();
  }, [pokemon]);

  // Identificar quais movimentos o Pokémon já tem em outros slots
  const movesAtuaisIds = (pokemon?.movimentos || [])
    .filter((m) => m.movimento_id !== movimentoAtual?.movimento_id)
    .map((m) => m.movimento_id);

  const filteredMoves = movimentos.filter((m) => {
    const jaTemOutroSlot = movesAtuaisIds.includes(m.id);
    const matchesSearch = m.nome.toLowerCase().includes(search.toLowerCase()) ||
                          m.tipo_nome.toLowerCase().includes(search.toLowerCase());
    return !jaTemOutroSlot && matchesSearch;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="retro-text" style={{ fontSize: '13px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚔️ Ensinar Novo Golpe para {pokemon?.apelido}
            </h3>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              {movimentoAtual ? `Substituindo: ${movimentoAtual.nome}` : 'Adicionando novo golpe'} (Movepool oficial FireRed)
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Campo de Busca */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #334155' }}>
          <input
            type="text"
            placeholder="🔍 Buscar golpe por nome ou tipo..."
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
        </div>

        {/* Lista de Golpes */}
        <div style={{ padding: '16px 20px', maxHeight: '52vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              Carregando lista de golpes compatíveis...
            </div>
          ) : filteredMoves.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
              Nenhum golpe novo disponível para aprender neste nível!
            </div>
          ) : (
            filteredMoves.map((mov) => {
              const isCurrent = mov.id === movimentoAtual?.movimento_id;
              const typeClass = getTypeClass(mov.tipo_nome);

              return (
                <button
                  key={mov.id}
                  onClick={() => {
                    if (!isCurrent) {
                      sounds.playSelect();
                      onSelectMove(mov.id);
                      onClose();
                    }
                  }}
                  disabled={isCurrent}
                  style={{
                    background: isCurrent ? '#14532d' : '#0f172a',
                    border: isCurrent ? '2px solid #22c55e' : '2px solid #334155',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    textAlign: 'left',
                    cursor: isCurrent ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isCurrent) e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    if (!isCurrent) e.currentTarget.style.borderColor = '#334155';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`type-badge ${typeClass}`} style={{ minWidth: '70px', textAlign: 'center' }}>
                      {mov.tipo_nome}
                    </span>
                    <div>
                      <span className="retro-text" style={{ fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }}>
                        {mov.nome}
                      </span>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                        <span>Nv. {mov.nivel_aprendizado}</span>
                        <span>{mov.categoria}</span>
                        <span>Prioridade: {mov.prioridade > 0 ? `+${mov.prioridade}` : mov.prioridade}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span className="retro-text" style={{ fontSize: '10px', color: '#fbbf24' }}>
                      PODER: {mov.poder > 0 ? mov.poder : '--'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      PREC: {mov.precisao ? `${mov.precisao}%` : '--'} • PP: {mov.pp_maximo}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: '2px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {filteredMoves.length} golpes compatíveis
          </span>
          <button onClick={onClose} className="btn-retro" style={{ background: '#64748b', color: '#fff' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
