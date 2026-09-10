import React, { useState, useEffect } from 'react';
import PokemonCard from './PokemonCard';
import PokemonPickerModal from './PokemonPickerModal';
import ItemPickerModal from './ItemPickerModal';
import MovePickerModal from './MovePickerModal';
import BagBuilderModal from './BagBuilderModal';
import {
  getPokedex,
  getHeldItems,
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
  mochila = [],
  onReloadMochila,
  onStartBattle,
  onNotify
}) {
  const [time, setTime] = useState([]);
  const [pokedex, setPokedex] = useState([]);
  const [heldItems, setHeldItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modais
  const [activeSlotForPokemon, setActiveSlotForPokemon] = useState(null);
  const [activePokemonForItem, setActivePokemonForItem] = useState(null);
  const [activeMoveTarget, setActiveMoveTarget] = useState(null); // { pokemon, movimentoAtual }
  const [showBagBuilder, setShowBagBuilder] = useState(false);

  // Carregar dados iniciais do time, pokédex e held items
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [resTime, resPokedex, resItems] = await Promise.all([
        getTimeTreinador(1),
        getPokedex(),
        getHeldItems()
      ]);

      if (resTime.sucesso) setTime(resTime.dados);
      if (resPokedex.sucesso) setPokedex(resPokedex.dados);
      if (resItems.sucesso) setHeldItems(resItems.dados);
    } catch (err) {
      console.error('Erro ao carregar teambuilder:', err);
      onNotify(`Erro ao carregar time: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Adicionar / Substituir Pokémon no slot
  const handleSelectSpecies = async (especie) => {
    if (!activeSlotForPokemon) return;
    try {
      const res = await criarPokemon({
        treinadorId: 1,
        especieId: especie.id_pokedex,
        nivel: 50,
        apelido: `${especie.nome} do Red`,
        posicaoTime: activeSlotForPokemon
      });

      if (res.sucesso) {
        onNotify(`${especie.nome} adicionado ao time!`, 'success');
        sounds.playPokemonCry(especie.id_pokedex);
        await carregarDados();
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
        onNotify('Pokémon removido do time.', 'info');
        await carregarDados();
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
        await carregarDados();
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
        await carregarDados();
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
        await carregarDados();
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
      const res = await chamarCentroPokemon(1);
      onNotify(res.mensagem, 'success');
      await carregarDados();
    } catch (err) {
      onNotify(`Erro: ${err.message}`, 'error');
    }
  };

  // Atualizar quantidade de itens na mochila
  const handleUpdateMochilaQty = async (itemId, quantidade) => {
    try {
      await atualizarMochila(1, itemId, quantidade);
      onReloadMochila();
    } catch (err) {
      onNotify(`Erro ao atualizar item: ${err.message}`, 'error');
    }
  };

  // Mapear os 6 slots fixos
  const slots = [1, 2, 3, 4, 5, 6].map((pos) => {
    return time.find((p) => p.posicao_time === pos) || null;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Barra de Ferramentas Superior */}
      <div
        className="gba-panel-dark"
        style={{
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <div>
          <h2 className="retro-text" style={{ fontSize: '14px', color: '#f59e0b', marginBottom: '4px' }}>
            🛠️ Teambuilder Estilo Showdown
          </h2>
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>
            Personalize sua equipe de até 6 Pokémons, troque golpes e equipe Held Items oficiais.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleJoyHeal}
            className="btn-retro"
            style={{ background: '#ec4899', color: '#fff', fontSize: '10px' }}
          >
            🏥 CENTRO POKÉMON
          </button>

          <button
            onClick={() => { sounds.playSelect(); setShowBagBuilder(true); }}
            className="btn-retro btn-bag"
            style={{ fontSize: '10px' }}
          >
            🎒 MOCHILA ({mochila.reduce((acc, it) => acc + (it.quantidade || 0), 0)} itens)
          </button>

          <button
            onClick={() => { sounds.playSelect(); onStartBattle(); }}
            className="btn-retro btn-fight"
            style={{ fontSize: '10px' }}
          >
            ⚔️ ENTRAR NA ARENA
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
    </div>
  );
}
