import React, { useState, useEffect } from 'react';
import PokemonCard from './PokemonCard';
import PokemonPickerModal from './PokemonPickerModal';
import ItemPickerModal from './ItemPickerModal';
import MovePickerModal from './MovePickerModal';
import BagBuilderModal from './BagBuilderModal';
import StatsEditorModal from './StatsEditorModal';
import {
  getPokedex,
  getHeldItems,
  getTreinadores,
  getTimeTreinador,
  criarPokemon,
  removerPokemon,
  equiparHeldItem,
  removerHeldItem,
  trocarGolpe,
  chamarCentroPokemon,
  atualizarMochila
} from '../../services/api';
import sounds from '../../services/soundEffects';

export default function TeamOverview({
  selectedTrainerId = 1,
  onSelectTrainerId,
  mochila = [],
  onReloadMochila,
  onStartBattle,
  onNotify
}) {
  const [currentTrainerId, setCurrentTrainerId] = useState(selectedTrainerId);
  const [treinadores, setTreinadores] = useState([]);
  const [time, setTime] = useState([]);
  const [pokedex, setPokedex] = useState([]);
  const [heldItems, setHeldItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [activeSlotForPokemon, setActiveSlotForPokemon] = useState(null);
  const [activePokemonForItem, setActivePokemonForItem] = useState(null);
  const [activePokemonForStats, setActivePokemonForStats] = useState(null);
  const [activeMoveTarget, setActiveMoveTarget] = useState(null); // { pokemon, movimentoAtual }
  const [showBagBuilder, setShowBagBuilder] = useState(false);

  // Sincronizar com props externas
  useEffect(() => {
    if (selectedTrainerId && selectedTrainerId !== currentTrainerId) {
      setCurrentTrainerId(selectedTrainerId);
    }
  }, [selectedTrainerId]);

  // Carregar dados gerais (treinadores, pokédex, held items)
  useEffect(() => {
    async function loadMeta() {
      try {
        const [resTreinadores, resPokedex, resItems] = await Promise.all([
          getTreinadores(),
          getPokedex(),
          getHeldItems()
        ]);
        if (resTreinadores.sucesso) setTreinadores(resTreinadores.dados);
        if (resPokedex.sucesso) setPokedex(resPokedex.dados);
        if (resItems.sucesso) setHeldItems(resItems.dados);
      } catch (err) {
        console.error('Erro ao carregar dados do Teambuilder:', err);
      }
    }
    loadMeta();
  }, []);

  // Carregar time do treinador selecionado
  const carregarTime = async (tId) => {
    try {
      setLoading(true);
      const res = await getTimeTreinador(tId);
      if (res.sucesso) setTime(res.dados);
    } catch (err) {
      console.error('Erro ao carregar time:', err);
      onNotify(`Erro ao carregar time: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarTime(currentTrainerId);
  }, [currentTrainerId]);

  const handleTrainerChange = (newId) => {
    sounds.playSelect();
    const idNum = parseInt(newId, 10);
    setCurrentTrainerId(idNum);
    if (onSelectTrainerId) onSelectTrainerId(idNum);
  };

  // Adicionar / Substituir Pokémon no slot
  const handleSelectSpecies = async (especie) => {
    if (!activeSlotForPokemon) return;
    try {
      // Obter nível médio do time atual ou padrão
      const nivelPadrao = time.length > 0 ? time[0].nivel : 50;
      const trainerInfo = treinadores.find((t) => t.id === currentTrainerId);
      const apelido = `${especie.nome} do ${trainerInfo?.nome || 'Treinador'}`;

      const res = await criarPokemon({
        treinadorId: currentTrainerId,
        especieId: especie.id_pokedex,
        nivel: nivelPadrao,
        apelido: apelido,
        posicaoTime: activeSlotForPokemon
      });

      if (res.sucesso) {
        onNotify(`${especie.nome} adicionado ao time!`, 'success');
        sounds.playPokemonCry(especie.id_pokedex);
        await carregarTime(currentTrainerId);
      }
    } catch (err) {
      onNotify(`Erro ao adicionar pokémon: ${err.message}`, 'error');
    } finally {
      setActiveSlotForPokemon(null);
    }
  };

  // Remover Pokémon do time
  const handleRemovePokemon = async (pokemonId) => {
    try {
      const res = await removerPokemon(pokemonId);
      if (res.sucesso) {
        onNotify('Pokémon removido com sucesso!', 'info');
        await carregarTime(currentTrainerId);
      }
    } catch (err) {
      onNotify(`Erro ao remover: ${err.message}`, 'error');
    }
  };

  // Equipar Held Item
  const handleEquipItem = async (heldItemId) => {
    if (!activePokemonForItem) return;
    try {
      const res = await equiparHeldItem(activePokemonForItem.id, heldItemId);
      if (res.sucesso) {
        onNotify(res.mensagem, 'success');
        await carregarTime(currentTrainerId);
      }
    } catch (err) {
      onNotify(`Erro ao equipar item: ${err.message}`, 'error');
    } finally {
      setActivePokemonForItem(null);
    }
  };

  // Remover Held Item
  const handleRemoveItem = async () => {
    if (!activePokemonForItem) return;
    try {
      const res = await removerHeldItem(activePokemonForItem.id);
      if (res.sucesso) {
        onNotify(res.mensagem, 'info');
        await carregarTime(currentTrainerId);
      }
    } catch (err) {
      onNotify(`Erro ao remover item: ${err.message}`, 'error');
    } finally {
      setActivePokemonForItem(null);
    }
  };

  // Trocar Golpe
  const handleSwapMove = async (novoMovimentoId) => {
    if (!activeMoveTarget) return;
    try {
      const res = await trocarGolpe(
        activeMoveTarget.pokemon.id,
        activeMoveTarget.movimentoAtual.movimento_id,
        novoMovimentoId
      );
      if (res.sucesso) {
        onNotify(res.mensagem, 'success');
        await carregarTime(currentTrainerId);
      }
    } catch (err) {
      onNotify(`Erro ao aprender golpe: ${err.message}`, 'error');
    } finally {
      setActiveMoveTarget(null);
    }
  };

  // Curar com Joy
  const handleJoyHeal = async () => {
    sounds.playNurseJoy();
    try {
      const res = await chamarCentroPokemon(currentTrainerId);
      onNotify(res.mensagem, 'success');
      await carregarTime(currentTrainerId);
    } catch (err) {
      onNotify(`Erro: ${err.message}`, 'error');
    }
  };

  // Atualizar quantidade de itens na mochila (do jogador Red)
  const handleUpdateMochilaQty = async (itemId, quantidade) => {
    try {
      await atualizarMochila(1, itemId, quantidade);
      onReloadMochila();
    } catch (err) {
      onNotify(`Erro ao atualizar item: ${err.message}`, 'error');
    }
  };

  const activeTrainer = treinadores.find((t) => t.id === currentTrainerId) || { nome: 'Red', eh_jogador: 1 };

  // Mapear os 6 slots fixos
  const slots = [1, 2, 3, 4, 5, 6].map((pos) => {
    return time.find((p) => p.posicao_time === pos) || null;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra de Ferramentas Superior com Seletor de Treinador */}
      <div
        className="gba-panel-dark"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Seletor de Treinador */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="retro-text" style={{ fontSize: '13px', color: '#f59e0b' }}>
              🛠️ Editando Equipe de:
            </h2>
            <select
              value={currentTrainerId}
              onChange={(e) => handleTrainerChange(e.target.value)}
              style={{
                background: '#0f172a',
                border: '2px solid #f59e0b',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontFamily: 'var(--font-modern)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <optgroup label="Treinador Jogador">
                <option value={1}>🔴 Red (Meu Time - Jogador)</option>
              </optgroup>
              <optgroup label="Campeão / Rival">
                <option value={2}>👑 Blue (Campeão)</option>
              </optgroup>
              <optgroup label="Líderes de Ginásio (1 a 8)">
                <option value={3}>🪨 Brock (Pewter)</option>
                <option value={4}>💧 Misty (Cerulean)</option>
                <option value={5}>⚡ Lt. Surge (Vermilion)</option>
                <option value={6}>🌿 Erika (Celadon)</option>
                <option value={7}>☠️ Koga (Fuchsia)</option>
                <option value={8}>🔮 Sabrina (Saffron)</option>
                <option value={9}>🔥 Blaine (Cinnabar)</option>
                <option value={10}>🌍 Giovanni (Viridian)</option>
              </optgroup>
              <optgroup label="Elite dos Quatro">
                <option value={11}>❄️ Lorelei (Elite 1 - Gelo)</option>
                <option value={12}>🥊 Bruno (Elite 2 - Lutador)</option>
                <option value={13}>👻 Agatha (Elite 3 - Fantasma)</option>
                <option value={14}>🐉 Lance (Elite 4 - Dragão)</option>
              </optgroup>
            </select>
          </div>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>
            {activeTrainer.eh_jogador
              ? 'Este é o seu time oficial usado na Arena de Batalha.'
              : `Você está editando a equipe do adversário oficial ${activeTrainer.nome}. As alterações refletirão nas batalhas!`}
          </span>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleJoyHeal}
            className="btn-retro"
            style={{ background: '#ec4899', color: '#fff', fontSize: '10px' }}
          >
            🏥 CURAR TIME (JOY)
          </button>

          {activeTrainer.eh_jogador ? (
            <button
              onClick={() => { sounds.playSelect(); setShowBagBuilder(true); }}
              className="btn-retro btn-bag"
              style={{ fontSize: '10px' }}
            >
              🎒 MOCHILA ({mochila.reduce((acc, it) => acc + (it.quantidade || 0), 0)} itens)
            </button>
          ) : null}

          <button
            onClick={() => { sounds.playSelect(); onStartBattle(); }}
            className="btn-retro btn-fight"
            style={{ fontSize: '10px' }}
          >
            ⚔️ DESAFIAR / BATALHAR
          </button>
        </div>
      </div>

      {/* Grid de 6 Slots de Pokémon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px'
        }}
      >
        {slots.map((pok, index) => {
          const posicao = index + 1;
          return (
            <PokemonCard
              key={posicao}
              pokemon={pok}
              posicao={posicao}
              onOpenPokemonPicker={(pos) => setActiveSlotForPokemon(pos)}
              onOpenItemPicker={(p) => setActivePokemonForItem(p)}
              onOpenMovePicker={(p, mov) => setActiveMoveTarget({ pokemon: p, movimentoAtual: mov })}
              onOpenStatsModal={(p) => setActivePokemonForStats(p)}
              onRemovePokemon={handleRemovePokemon}
            />
          );
        })}
      </div>

      {/* MODAL: Seleção de Pokémon (151) */}
      {activeSlotForPokemon && (
        <PokemonPickerModal
          pokedex={pokedex}
          onSelect={handleSelectSpecies}
          onClose={() => setActiveSlotForPokemon(null)}
        />
      )}

      {/* MODAL: Seleção de Held Items */}
      {activePokemonForItem && (
        <ItemPickerModal
          heldItems={heldItems}
          currentItemId={activePokemonForItem.held_item_id}
          pokemonNome={activePokemonForItem.apelido}
          onEquipItem={handleEquipItem}
          onRemoveItem={handleRemoveItem}
          onClose={() => setActivePokemonForItem(null)}
        />
      )}

      {/* MODAL: Seleção de Golpes */}
      {activeMoveTarget && (
        <MovePickerModal
          pokemon={activeMoveTarget.pokemon}
          movimentoAtual={activeMoveTarget.movimentoAtual}
          onSelectMove={handleSwapMove}
          onClose={() => setActiveMoveTarget(null)}
        />
      )}

      {/* MODAL: Gerenciador de Mochila */}
      {showBagBuilder && (
        <BagBuilderModal
          mochila={mochila}
          onUpdateQuantity={handleUpdateMochilaQty}
          onClose={() => setShowBagBuilder(false)}
        />
      )}

      {/* MODAL: Editor de IVs, EVs e Habilidade */}
      {activePokemonForStats && (
        <StatsEditorModal
          pokemon={activePokemonForStats}
          onClose={() => setActivePokemonForStats(null)}
          onSaved={() => carregarTime(currentTrainerId)}
          onNotify={onNotify}
        />
      )}
    </div>
  );
}
