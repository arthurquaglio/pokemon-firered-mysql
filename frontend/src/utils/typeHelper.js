// Utilitário compartilhado para normalização e estilização de tipos Pokémon

export const TYPE_TRANSLATION_PT_EN = {
  Normal: 'Normal',
  Fogo: 'Fire',
  Água: 'Water',
  Planta: 'Grass',
  Elétrico: 'Electric',
  Gelo: 'Ice',
  Lutador: 'Fighting',
  Venenoso: 'Poison',
  Terra: 'Ground',
  Voador: 'Flying',
  Psíquico: 'Psychic',
  Inseto: 'Bug',
  Pedra: 'Rock',
  Fantasma: 'Ghost',
  Dragão: 'Dragon',
  Aço: 'Steel',
  Noturno: 'Dark'
};

export const TYPE_TRANSLATION_EN_PT = {
  Normal: 'Normal',
  Fire: 'Fogo',
  Water: 'Água',
  Grass: 'Planta',
  Electric: 'Elétrico',
  Ice: 'Gelo',
  Fighting: 'Lutador',
  Poison: 'Venenoso',
  Ground: 'Terra',
  Flying: 'Voador',
  Psychic: 'Psíquico',
  Bug: 'Inseto',
  Rock: 'Pedra',
  Ghost: 'Fantasma',
  Dragon: 'Dragão',
  Steel: 'Aço',
  Dark: 'Noturno'
};

export const typeClassMap = {
  // Português
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
  Noturno: 'type-noturno',

  // Inglês (vinda direta do MySQL)
  Fire: 'type-fogo',
  Water: 'type-agua',
  Grass: 'type-planta',
  Electric: 'type-eletrico',
  Ice: 'type-gelo',
  Fighting: 'type-lutador',
  Poison: 'type-venenoso',
  Ground: 'type-terra',
  Flying: 'type-voador',
  Psychic: 'type-psiquico',
  Bug: 'type-inseto',
  Rock: 'type-pedra',
  Ghost: 'type-fantasma',
  Dragon: 'type-dragao',
  Steel: 'type-aco',
  Dark: 'type-noturno'
};

export function getTypeClass(typeName) {
  if (!typeName) return 'type-normal';
  return typeClassMap[typeName] || 'type-normal';
}

export function formatTypeName(typeName) {
  if (!typeName) return '';
  return TYPE_TRANSLATION_EN_PT[typeName] || typeName;
}
