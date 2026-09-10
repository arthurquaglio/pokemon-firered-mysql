const API_BASE_URL = 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.erro || `Erro HTTP ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`Erro na requisição ${endpoint}:`, error);
    throw error;
  }
}

// 1. Pokédex e Dados Gerais
export const getPokedex = () => request('/pokedex');
export const getMovimentosEspecie = (especieId) => request(`/movimentos/${especieId}`);
export const getHeldItems = () => request('/held-items');
export const getTreinadores = () => request('/treinadores');

// 2. Teambuilder e Mochila
export const getTimeTreinador = (treinadorId = 1) => request(`/treinador/${treinadorId}/time`);
export const getMochila = (treinadorId = 1) => request(`/treinador/${treinadorId}/mochila`);
export const atualizarMochila = (treinadorId, itemId, quantidade) =>
  request(`/treinador/${treinadorId}/mochila/atualizar`, {
    method: 'POST',
    body: JSON.stringify({ itemId, quantidade })
  });

export const criarPokemon = (dados) =>
  request('/pokemon/criar', {
    method: 'POST',
    body: JSON.stringify(dados)
  });

export const removerPokemon = (pokemonId) =>
  request('/pokemon/remover', {
    method: 'POST',
    body: JSON.stringify({ pokemonId })
  });

export const equiparHeldItem = (pokemonId, heldItemId) =>
  request('/pokemon/held-item', {
    method: 'POST',
    body: JSON.stringify({ pokemonId, heldItemId })
  });

export const removerHeldItem = (pokemonId) =>
  request('/pokemon/remover-held-item', {
    method: 'POST',
    body: JSON.stringify({ pokemonId })
  });

export const trocarGolpe = (pokemonId, movimentoAtualId, novoMovimentoId) =>
  request('/pokemon/trocar-golpe', {
    method: 'POST',
    body: JSON.stringify({ pokemonId, movimentoAtualId, novoMovimentoId })
  });

export const chamarCentroPokemon = (treinadorId = 1) =>
  request('/centro-pokemon', {
    method: 'POST',
    body: JSON.stringify({ treinadorId })
  });

// 3. Engine de Batalha
export const iniciarBatalha = (jogadorId = 1, oponenteId = 2, forcarReinicio = false) =>
  request('/batalha/iniciar', {
    method: 'POST',
    body: JSON.stringify({ jogadorId, oponenteId, forcarReinicio })
  });

export const executarTurno = (batalhaId, movimentoId) =>
  request('/batalha/turno', {
    method: 'POST',
    body: JSON.stringify({ batalhaId, movimentoId })
  });

export const trocarPokemonBatalha = (batalhaId, novoPokemonId) =>
  request('/batalha/trocar', {
    method: 'POST',
    body: JSON.stringify({ batalhaId, novoPokemonId })
  });

export const usarItemBatalha = (batalhaId, itemId, alvoPokemonId) =>
  request('/batalha/usar-item', {
    method: 'POST',
    body: JSON.stringify({ batalhaId, itemId, alvoPokemonId })
  });

export const getStatusBatalha = (batalhaId) => request(`/batalha/${batalhaId}/status`);
export const getLogsBatalha = (batalhaId) => request(`/batalha/${batalhaId}/logs`);
export const cancelarBatalha = (batalhaId) =>
  request('/batalha/cancelar', {
    method: 'POST',
    body: JSON.stringify({ batalhaId })
  });
