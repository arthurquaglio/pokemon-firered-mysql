import React, { useState, useEffect } from 'react';
import HpBar from './HpBar';
import BattleMenu from './BattleMenu';
import BagModal from './BagModal';
import SwitchModal from './SwitchModal';
import BattleResultModal from './BattleResultModal';
import sounds from '../../services/soundEffects';

export default function BattleArena({
  batalhaEstado,
  mochila = [],
  onExecuteTurn,
  onSwitchPokemon,
  onUseItem,
  onRun,
  onRematch,
  onBackToBuilder,
  loading = false
}) {
  const [showBag, setShowBag] = useState(false);
  const [showSwitch, setShowSwitch] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [damageTarget, setDamageTarget] = useState(null); // 'player' | 'opponent' | null

  const { batalha, pokemonJogador, pokemonOponente, timeJogador, timeOponente } = batalhaEstado || {};

  // Tocar cry do pokémon ao entrar
  useEffect(() => {
    if (pokemonJogador?.especie_id) {
      sounds.playPokemonCry(pokemonJogador.especie_id);
    }
  }, [pokemonJogador?.id]);

  // Função para acionar animações visuais e sonoras ao executar turno
  const handleSelectMove = async (movimentoId) => {
    try {
      const res = await onExecuteTurn(movimentoId);
      
      // Analisar logs recentes para tocar efeitos adequados
      const logs = res?.logs || [];
      const ultimoLog = logs[logs.length - 1]?.mensagem || '';
      const upper = ultimoLog.toUpperCase();

      if (upper.includes('SUPER EFETIVO')) {
        sounds.playSuperEffective();
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 500);
      } else if (upper.includes('POUCO EFETIVO')) {
        sounds.playNotVeryEffective();
      } else {
        sounds.playAttackHit();
      }

      // Piscar sprite
      setDamageTarget('opponent');
      setTimeout(() => setDamageTarget('player'), 350);
      setTimeout(() => setDamageTarget(null), 700);
    } catch (err) {
      console.error('Erro ao executar turno:', err);
    }
  };

  const handleSwitch = (novoPokemonId) => {
    onSwitchPokemon(novoPokemonId);
    setDamageTarget('player');
    setTimeout(() => setDamageTarget(null), 500);
  };

  const handleUseItem = (itemId, alvoId) => {
    onUseItem(itemId, alvoId);
    setDamageTarget('player');
    setTimeout(() => setDamageTarget(null), 500);
  };

  const isFinished = batalha?.status === 'VITORIA_JOGADOR' || batalha?.status === 'DERROTA_JOGADOR';

  // URLs oficiais dos Sprites Gen 3 FireRed
  const opoSpriteUrl = pokemonOponente?.especie_id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/${pokemonOponente.especie_id}.png`
    : null;

  const jogSpriteUrl = pokemonJogador?.especie_id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iii/firered-leafgreen/back/${pokemonJogador.especie_id}.png`
    : null;

  return (
    <div
      className={`gba-panel-dark ${screenShake ? 'screen-shake' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '16px',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
        position: 'relative'
      }}
    >
      {/* CENÁRIO DE BATALHA RETRÔ GBA */}
      <div
        style={{
          width: '100%',
          height: '360px',
          borderRadius: '8px',
          border: '4px solid #1e293b',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #60a5fa 0%, #93c5fd 55%, #86efac 56%, #22c55e 100%)',
          boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* =========================================
            LADO DO OPONENTE (SUPERIOR)
            ========================================= */}
        {/* Caixa de Status do Oponente (Superior Esquerda) */}
        <div
          className="gba-box"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            width: '230px',
            padding: '8px 12px',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="retro-text" style={{ fontSize: '10px', color: '#0f172a', fontWeight: 'bold' }}>
              {pokemonOponente?.apelido || 'Oponente'}
            </span>
            <span className="retro-text" style={{ fontSize: '8px', color: '#475569' }}>
              Lv.{pokemonOponente?.nivel || 50}
            </span>
          </div>

          <HpBar hpAtual={pokemonOponente?.hp_atual || 0} hpMax={pokemonOponente?.hp_max || 1} showText={false} />

          {/* Indicador de Pokebolas Restantes do Oponente */}
          <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
            {(timeOponente || []).map((pok, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '10px',
                  filter: pok.esta_desmaiado || pok.hp_atual <= 0 ? 'grayscale(100%) opacity(35%)' : 'none'
                }}
                title={pok.apelido}
              >
                🔴
              </span>
            ))}
          </div>
        </div>

        {/* Plataforma e Sprite Frontal do Oponente (Superior Direita) */}
        <div
          style={{
            position: 'absolute',
            top: '55px',
            right: '65px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Base / Plataforma de Grama Oponente */}
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              width: '160px',
              height: '45px',
              background: 'radial-gradient(ellipse at center, #15803d 0%, #166534 60%, transparent 75%)',
              borderRadius: '50%',
              zIndex: 1
            }}
          />

          {/* Sprite Frontal */}
          {opoSpriteUrl && (
            <img
              src={opoSpriteUrl}
              alt={pokemonOponente?.apelido || 'Oponente'}
              className={`pixelated sprite-entry ${damageTarget === 'opponent' ? 'sprite-damaged' : ''}`}
              style={{
                width: '130px',
                height: '130px',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
                filter: (pokemonOponente?.hp_atual || 0) <= 0 ? 'grayscale(100%) brightness(0.4)' : 'none',
                transition: 'filter 0.3s ease'
              }}
            />
          )}
        </div>

        {/* =========================================
            LADO DO JOGADOR (INFERIOR)
            ========================================= */}
        {/* Plataforma e Sprite Traseiro do Jogador (Inferior Esquerda) */}
        <div
          style={{
            position: 'absolute',
            bottom: '15px',
            left: '50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Base / Plataforma do Jogador */}
          <div
            style={{
              position: 'absolute',
              bottom: '5px',
              width: '180px',
              height: '50px',
              background: 'radial-gradient(ellipse at center, #166534 0%, #14532d 65%, transparent 80%)',
              borderRadius: '50%',
              zIndex: 1
            }}
          />

          {/* Sprite Traseiro */}
          {jogSpriteUrl && (
            <img
              src={jogSpriteUrl}
              alt={pokemonJogador?.apelido || 'Seu Pokémon'}
              className={`pixelated sprite-entry ${damageTarget === 'player' ? 'sprite-damaged' : ''}`}
              style={{
                width: '150px',
                height: '150px',
                objectFit: 'contain',
                position: 'relative',
                zIndex: 2,
                filter: (pokemonJogador?.hp_atual || 0) <= 0 ? 'grayscale(100%) brightness(0.4)' : 'none',
                transition: 'filter 0.3s ease'
              }}
            />
          )}
        </div>

        {/* Caixa de Status do Jogador (Inferior Direita) */}
        <div
          className="gba-box"
          style={{
            position: 'absolute',
            bottom: '16px',
            right: '16px',
            width: '260px',
            padding: '10px 14px',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span className="retro-text" style={{ fontSize: '11px', color: '#0f172a', fontWeight: 'bold' }}>
              {pokemonJogador?.apelido || 'Jogador'}
            </span>
            <span className="retro-text" style={{ fontSize: '9px', color: '#475569' }}>
              Lv.{pokemonJogador?.nivel || 50}
            </span>
          </div>

          <HpBar hpAtual={pokemonJogador?.hp_atual || 0} hpMax={pokemonJogador?.hp_max || 1} showText={true} />

          {/* Indicador de Pokebolas e Held Item */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ display: 'flex', gap: '3px' }}>
              {(timeJogador || []).map((pok, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '10px',
                    filter: pok.esta_desmaiado || pok.hp_atual <= 0 ? 'grayscale(100%) opacity(35%)' : 'none'
                  }}
                  title={pok.apelido}
                >
                  🔴
                </span>
              ))}
            </div>

            {pokemonJogador?.held_item_nome && (
              <span
                className="retro-text"
                style={{
                  fontSize: '7px',
                  background: '#0284c7',
                  color: '#fff',
                  padding: '2px 4px',
                  borderRadius: '3px'
                }}
              >
                🎒 {pokemonJogador.held_item_nome}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MENU DE AÇÕES GBA */}
      <BattleMenu
        pokemonJogador={pokemonJogador}
        onSelectMove={handleSelectMove}
        onOpenBag={() => setShowBag(true)}
        onOpenPokemon={() => setShowSwitch(true)}
        onRun={onRun}
        disabled={loading || isFinished}
      />

      {/* MODAL DA MOCHILA (BAG) */}
      {showBag && (
        <BagModal
          mochila={mochila}
          timeJogador={timeJogador}
          onUseItem={handleUseItem}
          onClose={() => setShowBag(false)}
          disabled={loading}
        />
      )}

      {/* MODAL DE TROCA DE POKÉMON (PKMN) */}
      {showSwitch && (
        <SwitchModal
          timeJogador={timeJogador}
          pokemonAtivoId={pokemonJogador?.id}
          onSwitchPokemon={handleSwitch}
          onClose={() => setShowSwitch(false)}
          disabled={loading}
        />
      )}

      {/* MODAL DE VITÓRIA OU DERROTA */}
      {isFinished && (
        <BattleResultModal
          status={batalha.status}
          oponenteNome={batalha.oponente_nome}
          onRematch={onRematch}
          onBackToBuilder={onBackToBuilder}
        />
      )}
    </div>
  );
}
