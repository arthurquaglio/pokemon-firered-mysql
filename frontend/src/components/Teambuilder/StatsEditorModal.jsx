import React, { useState, useMemo } from 'react';
import sounds from '../../services/soundEffects';
import { atualizarStatsPokemon, atualizarHabilidadePokemon } from '../../services/api';

const STATS_CONFIG = [
  { key: 'hp', label: 'HP', ivKey: 'iv_hp', evKey: 'ev_hp', baseKey: 'hp_base', color: '#ef4444' },
  { key: 'ataque', label: 'Ataque', ivKey: 'iv_ataque', evKey: 'ev_ataque', baseKey: 'ataque_base', color: '#f97316' },
  { key: 'defesa', label: 'Defesa', ivKey: 'iv_defesa', evKey: 'ev_defesa', baseKey: 'defesa_base', color: '#eab308' },
  { key: 'sp_ataque', label: 'Sp. Atk', ivKey: 'iv_sp_ataque', evKey: 'ev_sp_ataque', baseKey: 'sp_ataque_base', color: '#3b82f6' },
  { key: 'sp_defesa', label: 'Sp. Def', ivKey: 'iv_sp_defesa', evKey: 'ev_sp_defesa', baseKey: 'sp_defesa_base', color: '#10b981' },
  { key: 'velocidade', label: 'Velocidade', ivKey: 'iv_velocidade', evKey: 'ev_velocidade', baseKey: 'velocidade_base', color: '#a855f7' }
];

// Fórmula oficial Gen 3 para cálculo de atributo
function calcularHpFinal(base, iv, ev, nivel = 50) {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel) / 100) + nivel + 10;
}

function calcularStatFinal(base, iv, ev, nivel = 50) {
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * nivel) / 100) + 5;
}

export default function StatsEditorModal({ pokemon, onSave, onClose }) {
  const [ivs, setIvs] = useState({
    iv_hp: pokemon.iv_hp ?? 15,
    iv_ataque: pokemon.iv_ataque ?? 15,
    iv_defesa: pokemon.iv_defesa ?? 15,
    iv_sp_ataque: pokemon.iv_sp_ataque ?? 15,
    iv_sp_defesa: pokemon.iv_sp_defesa ?? 15,
    iv_velocidade: pokemon.iv_velocidade ?? 15
  });

  const [evs, setEvs] = useState({
    ev_hp: pokemon.ev_hp ?? 0,
    ev_ataque: pokemon.ev_ataque ?? 0,
    ev_defesa: pokemon.ev_defesa ?? 0,
    ev_sp_ataque: pokemon.ev_sp_ataque ?? 0,
    ev_sp_defesa: pokemon.ev_sp_defesa ?? 0,
    ev_velocidade: pokemon.ev_velocidade ?? 0
  });

  const [selectedAbilityId, setSelectedAbilityId] = useState(
    pokemon.habilidade_id || pokemon.habilidade1_id || 1
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Soma total de EVs
  const totalEvs = useMemo(() => {
    return (
      Number(evs.ev_hp) +
      Number(evs.ev_ataque) +
      Number(evs.ev_defesa) +
      Number(evs.ev_sp_ataque) +
      Number(evs.ev_sp_defesa) +
      Number(evs.ev_velocidade)
    );
  }, [evs]);

  const evLimitExceeded = totalEvs > 510;

  const handleIvChange = (key, val) => {
    const num = Math.min(31, Math.max(0, parseInt(val, 10) || 0));
    setIvs((prev) => ({ ...prev, [key]: num }));
  };

  const handleEvChange = (key, val) => {
    const num = Math.min(255, Math.max(0, parseInt(val, 10) || 0));
    setEvs((prev) => ({ ...prev, [key]: num }));
  };

  // Presets Competitivos
  const applyPreset = (presetType) => {
    sounds.playSelect();
    if (presetType === 'MAX_IVS') {
      setIvs({
        iv_hp: 31,
        iv_ataque: 31,
        iv_defesa: 31,
        iv_sp_ataque: 31,
        iv_sp_defesa: 31,
        iv_velocidade: 31
      });
    } else if (presetType === 'RESET_EVS') {
      setEvs({
        ev_hp: 0,
        ev_ataque: 0,
        ev_defesa: 0,
        ev_sp_ataque: 0,
        ev_sp_defesa: 0,
        ev_velocidade: 0
      });
    } else if (presetType === 'PHYSICAL_SWEEPER') {
      setEvs({
        ev_hp: 4,
        ev_ataque: 252,
        ev_defesa: 0,
        ev_sp_ataque: 0,
        ev_sp_defesa: 0,
        ev_velocidade: 252
      });
    } else if (presetType === 'SPECIAL_SWEEPER') {
      setEvs({
        ev_hp: 4,
        ev_ataque: 0,
        ev_defesa: 0,
        ev_sp_ataque: 252,
        ev_sp_defesa: 0,
        ev_velocidade: 252
      });
    } else if (presetType === 'BULKY_TANK') {
      setEvs({
        ev_hp: 252,
        ev_ataque: 0,
        ev_defesa: 252,
        ev_sp_ataque: 0,
        ev_sp_defesa: 4,
        ev_velocidade: 0
      });
    }
  };

  const handleSave = async () => {
    if (evLimitExceeded) return;
    try {
      setSaving(true);
      setErrorMsg(null);

      // 1. Atualizar IVs e EVs via Stored Procedure
      const resStats = await atualizarStatsPokemon(pokemon.id, {
        ...ivs,
        ...evs
      });

      // 2. Se a habilidade foi alterada, atualizar também
      if (selectedAbilityId && selectedAbilityId !== pokemon.habilidade_id) {
        await atualizarHabilidadePokemon(pokemon.id, selectedAbilityId);
      }

      sounds.playLevelUp();
      if (onSave) onSave(resStats.pokemon);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar IVs/EVs:', err);
      setErrorMsg(err.message || 'Erro ao salvar alterações no banco.');
    } finally {
      setSaving(false);
    }
  };

  // Habilidades disponíveis da espécie
  const availableAbilities = useMemo(() => {
    const list = [];
    if (pokemon.habilidade1_id) {
      list.push({
        id: pokemon.habilidade1_id,
        nome: pokemon.habilidade1_nome || 'Habilidade 1',
        descricao: pokemon.habilidade1_descricao || ''
      });
    }
    if (pokemon.habilidade2_id && pokemon.habilidade2_id !== pokemon.habilidade1_id) {
      list.push({
        id: pokemon.habilidade2_id,
        nome: pokemon.habilidade2_nome || 'Habilidade 2',
        descricao: pokemon.habilidade2_descricao || ''
      });
    }
    // Fallback caso a espécie ainda não tenha carregado habilidade1_nome
    if (list.length === 0 && pokemon.habilidade_nome) {
      list.push({
        id: pokemon.habilidade_id || 1,
        nome: pokemon.habilidade_nome_formatado || pokemon.habilidade_nome,
        descricao: pokemon.habilidade_descricao || ''
      });
    }
    return list;
  }, [pokemon]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '2px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.especie_id}.png`}
              alt={pokemon.apelido}
              className="pixelated"
              style={{ width: '48px', height: '48px' }}
            />
            <div>
              <h3 className="retro-text" style={{ fontSize: '13px', color: '#38bdf8' }}>
                ⚙️ Configurar IVs, EVs e Habilidade - {pokemon.apelido}
              </h3>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Lv. {pokemon.nivel} • Valores Individuais (0-31) e Pontos de Esforço (máx 510)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {errorMsg && (
            <div style={{ background: '#7f1d1d', border: '1px solid #ef4444', padding: '8px 12px', borderRadius: '6px', color: '#fecaca', fontSize: '11px' }}>
              ❌ {errorMsg}
            </div>
          )}

          {/* Seletor de Habilidade */}
          <div style={{ background: '#0f172a', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <span className="retro-text" style={{ fontSize: '9px', color: '#fbbf24', display: 'block', marginBottom: '8px' }}>
              ✨ HABILIDADE DA ESPÉCIE:
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {availableAbilities.map((hab) => {
                const active = selectedAbilityId === hab.id;
                return (
                  <button
                    key={hab.id}
                    onClick={() => { sounds.playSelect(); setSelectedAbilityId(hab.id); }}
                    style={{
                      flex: 1,
                      minWidth: '220px',
                      padding: '8px 12px',
                      background: active ? '#1e3a8a' : '#1e293b',
                      border: active ? '2px solid #38bdf8' : '1px solid #475569',
                      borderRadius: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      color: '#f8fafc',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span className="retro-text" style={{ fontSize: '10px', color: active ? '#38bdf8' : '#e2e8f0', fontWeight: 'bold' }}>
                        {hab.nome}
                      </span>
                      {active && <span style={{ fontSize: '10px' }}>✓</span>}
                    </div>
                    <p style={{ fontSize: '10px', color: '#94a3b8', margin: 0, lineHeight: '1.3' }}>
                      {hab.descricao}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Progresso do Total de EVs */}
          <div style={{ background: '#0f172a', padding: '12px 14px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span className="retro-text" style={{ fontSize: '9px', color: '#94a3b8' }}>
                TOTAL DE EVS DISTRIBUÍDOS:
              </span>
              <span
                className="retro-text"
                style={{
                  fontSize: '10px',
                  color: evLimitExceeded ? '#ef4444' : totalEvs === 510 ? '#10b981' : '#38bdf8',
                  fontWeight: 'bold'
                }}
              >
                {totalEvs} / 510 {evLimitExceeded && '⚠️ (ULTRAPASSOU O LIMITE!)'}
              </span>
            </div>

            <div style={{ width: '100%', height: '10px', background: '#1e293b', borderRadius: '5px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${Math.min(100, (totalEvs / 510) * 100)}%`,
                  height: '100%',
                  background: evLimitExceeded
                    ? '#ef4444'
                    : totalEvs === 510
                    ? '#10b981'
                    : 'linear-gradient(90deg, #38bdf8, #818cf8)',
                  transition: 'width 0.2s ease, background 0.2s ease'
                }}
              />
            </div>

            {/* Presets Rápidos */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
              <button
                onClick={() => applyPreset('MAX_IVS')}
                className="btn-retro"
                style={{ fontSize: '8px', padding: '4px 8px', background: '#3b82f6', color: '#fff' }}
              >
                ✨ Max IVs (31)
              </button>
              <button
                onClick={() => applyPreset('PHYSICAL_SWEEPER')}
                className="btn-retro"
                style={{ fontSize: '8px', padding: '4px 8px', background: '#f97316', color: '#fff' }}
              >
                ⚡ Atacante Físico (252 Atk / 252 Spd / 4 HP)
              </button>
              <button
                onClick={() => applyPreset('SPECIAL_SWEEPER')}
                className="btn-retro"
                style={{ fontSize: '8px', padding: '4px 8px', background: '#8b5cf6', color: '#fff' }}
              >
                🔮 Atacante Especial (252 SpAtk / 252 Spd / 4 HP)
              </button>
              <button
                onClick={() => applyPreset('BULKY_TANK')}
                className="btn-retro"
                style={{ fontSize: '8px', padding: '4px 8px', background: '#10b981', color: '#fff' }}
              >
                🛡️ Tanque (252 HP / 252 Def / 4 SpDef)
              </button>
              <button
                onClick={() => applyPreset('RESET_EVS')}
                className="btn-retro"
                style={{ fontSize: '8px', padding: '4px 8px', background: '#64748b', color: '#fff' }}
              >
                🔄 Zerar EVs (0)
              </button>
            </div>
          </div>

          {/* Grid de Atributos com Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '110px 75px 1fr 1fr',
                gap: '8px',
                fontSize: '9px',
                color: '#94a3b8',
                fontWeight: 'bold',
                padding: '0 8px'
              }}
              className="retro-text"
            >
              <span>ATRIBUTO</span>
              <span style={{ textAlign: 'center' }}>STAT FINAL</span>
              <span>IV (0 - 31)</span>
              <span>EV (0 - 255)</span>
            </div>

            {STATS_CONFIG.map((stat) => {
              const baseVal = pokemon[stat.baseKey] || 50;
              const ivVal = ivs[stat.ivKey];
              const evVal = evs[stat.evKey];
              const statFinal =
                stat.key === 'hp'
                  ? calcularHpFinal(baseVal, ivVal, evVal, pokemon.nivel || 50)
                  : calcularStatFinal(baseVal, ivVal, evVal, pokemon.nivel || 50);

              return (
                <div
                  key={stat.key}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'grid',
                    gridTemplateColumns: '110px 75px 1fr 1fr',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  {/* Nome e Base */}
                  <div>
                    <span className="retro-text" style={{ fontSize: '10px', color: stat.color, fontWeight: 'bold' }}>
                      {stat.label}
                    </span>
                    <span style={{ fontSize: '9px', color: '#64748b', display: 'block' }}>
                      Base: {baseVal}
                    </span>
                  </div>

                  {/* Valor Final Calculado */}
                  <div style={{ textAlign: 'center' }}>
                    <span
                      className="retro-text"
                      style={{
                        fontSize: '12px',
                        color: '#f8fafc',
                        background: '#1e293b',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid #475569',
                        display: 'inline-block'
                      }}
                    >
                      {statFinal}
                    </span>
                  </div>

                  {/* Slider & Input de IV */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="range"
                      min="0"
                      max="31"
                      value={ivVal}
                      onChange={(e) => handleIvChange(stat.ivKey, e.target.value)}
                      style={{ flex: 1, accentColor: stat.color }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="31"
                      value={ivVal}
                      onChange={(e) => handleIvChange(stat.ivKey, e.target.value)}
                      style={{
                        width: '42px',
                        padding: '3px 4px',
                        background: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        textAlign: 'center'
                      }}
                    />
                  </div>

                  {/* Slider & Input de EV */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="range"
                      min="0"
                      max="255"
                      step="4"
                      value={evVal}
                      onChange={(e) => handleEvChange(stat.evKey, e.target.value)}
                      style={{ flex: 1, accentColor: stat.color }}
                    />
                    <input
                      type="number"
                      min="0"
                      max="255"
                      value={evVal}
                      onChange={(e) => handleEvChange(stat.evKey, e.target.value)}
                      style={{
                        width: '50px',
                        padding: '3px 4px',
                        background: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        textAlign: 'center'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '2px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button onClick={onClose} className="btn-retro" style={{ background: '#64748b', color: '#fff' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || evLimitExceeded}
            className="btn-retro"
            style={{
              background: evLimitExceeded ? '#475569' : '#10b981',
              color: '#fff',
              cursor: evLimitExceeded ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? '⏳ Salvando no Banco...' : '💾 Salvar Atributos (Recalcular)'}
          </button>
        </div>
      </div>
    </div>
  );
}
