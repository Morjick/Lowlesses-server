import { GameModeInterface } from '../entities/RoomEntity'
import { createRandomNumber } from '../libs/createRandomNumber'
import { PlayerComandType, PlayerPositionInterface } from '../models/UserModel'

export interface CoordsInterface {
  x: number
  y: number
  z?: number
  offsetZPosition?: number
}

export interface RespawnInterface {
  coords: CoordsInterface
  comand: PlayerComandType
}

export interface ComandRespansInterface {
  blue: RespawnInterface[]
  red: RespawnInterface[]
  any?: RespawnInterface[]
}

export interface GameMapBorders {
  leftTop: CoordsInterface
  rightBottom: CoordsInterface
}

export interface GameMapInterface {
  gameMods: GameModeInterface[]
  mapName: string
  maxPlayersCount: number
  comandRespawns: ComandRespansInterface
  borders: GameMapBorders
}

export interface CreateRandomMapParamInterface {
  gameMode: GameModeInterface
  playersCount?: number
}

export interface GetRandomRespawnParamInterface {
  gameMap: GameMapInterface
  comand: PlayerComandType
}

export const LavaCastleMap: GameMapInterface = {
  gameMods: ['capture the flag', 'crystal capture', 'team dethmatch'],
  mapName: 'LavaCastle',
  maxPlayersCount: 10,
  comandRespawns: {
    blue: [
      {
        comand: 'blue',
        coords: { x: 100, y: 100 },
      },
      {
        comand: 'blue',
        coords: { x: 150, y: 150 },
      },
      {
        comand: 'blue',
        coords: { x: 200, y: 200 },
      },
    ],
    red: [
      {
        comand: 'red',
        coords: { x: -100, y: -100 },
      },
      {
        comand: 'red',
        coords: { x: -150, y: -150 },
      },
      {
        comand: 'red',
        coords: { x: -200, y: -200 },
      },
    ],
  },
  borders: {
    leftTop: {
      x: 0,
      y: 0,
      z: 0,
      offsetZPosition: 5,
    },
    rightBottom: {
      x: 100,
      y: 100,
      z: 100,
      offsetZPosition: 5,
    },
  },
}

export const AbandonedCastleMap: GameMapInterface = {
  gameMods: ['team dethmatch', 'deathmatch'],
  mapName: 'AbandonedCastle',
  maxPlayersCount: 10,
  comandRespawns: {
    blue: [
      {
        comand: 'blue',
        coords: { x: 100, y: 100 },
      },
      {
        comand: 'blue',
        coords: { x: 150, y: 150 },
      },
      {
        comand: 'blue',
        coords: { x: 200, y: 200 },
      },
    ],
    red: [
      {
        comand: 'red',
        coords: { x: -100, y: -100 },
      },
      {
        comand: 'red',
        coords: { x: -150, y: -150 },
      },
      {
        comand: 'red',
        coords: { x: -200, y: -200 },
      },
    ],
    any: [
      {
        comand: 'blue',
        coords: { x: 100, y: 100 },
      },
      {
        comand: 'blue',
        coords: { x: 150, y: 150 },
      },
      {
        comand: 'blue',
        coords: { x: 200, y: 200 },
      },
      {
        comand: 'red',
        coords: { x: -100, y: -100 },
      },
      {
        comand: 'red',
        coords: { x: -150, y: -150 },
      },
      {
        comand: 'red',
        coords: { x: -200, y: -200 },
      },
    ],
  },
  borders: {
    leftTop: {
      x: 0,
      y: 0,
      z: 0,
      offsetZPosition: 5,
    },
    rightBottom: {
      x: 100,
      y: 100,
      z: 100,
      offsetZPosition: 5,
    },
  },
}

export const DarkCastleMap: GameMapInterface = {
  gameMods: ['team dethmatch', 'deathmatch'],
  mapName: 'DarkCastle',
  maxPlayersCount: 10,
  comandRespawns: {
    blue: [
      {
        comand: 'blue',
        coords: { x: 100, y: 100 },
      },
      {
        comand: 'blue',
        coords: { x: 150, y: 150 },
      },
      {
        comand: 'blue',
        coords: { x: 200, y: 200 },
      },
    ],
    red: [
      {
        comand: 'red',
        coords: { x: -100, y: -100 },
      },
      {
        comand: 'red',
        coords: { x: -150, y: -150 },
      },
      {
        comand: 'red',
        coords: { x: -200, y: -200 },
      },
    ],
    any: [
      {
        comand: 'blue',
        coords: { x: 100, y: 100 },
      },
      {
        comand: 'blue',
        coords: { x: 150, y: 150 },
      },
      {
        comand: 'blue',
        coords: { x: 200, y: 200 },
      },
      {
        comand: 'red',
        coords: { x: -100, y: -100 },
      },
      {
        comand: 'red',
        coords: { x: -150, y: -150 },
      },
      {
        comand: 'red',
        coords: { x: -200, y: -200 },
      },
    ],
  },
  borders: {
    leftTop: {
      x: 0,
      y: 0,
      z: 0,
      offsetZPosition: 5,
    },
    rightBottom: {
      x: 100,
      y: 100,
      z: 100,
      offsetZPosition: 5,
    },
  },
}

export const getRandomMap = (
  mapParams: CreateRandomMapParamInterface
): GameMapInterface => {
  const gameMaps = [LavaCastleMap, AbandonedCastleMap, DarkCastleMap]

  const suitableMaps = gameMaps.filter((map) => {
    return map.gameMods.includes(mapParams.gameMode)
  })

  if (!suitableMaps.length) return null

  if (suitableMaps.length === 1) {
    return suitableMaps[0]
  }

  const randomMapIndex = createRandomNumber(0, suitableMaps.length)
  return suitableMaps[randomMapIndex]
}

export const getRandomRespawn = (
  param: GetRandomRespawnParamInterface
): PlayerPositionInterface => {
  const respawns = param.gameMap.comandRespawns[param.comand]

  const randomRespawnIndex = createRandomNumber(0, respawns.length)

  return {
    ...respawns[randomRespawnIndex],
    isFlipX: respawns[randomRespawnIndex].comand === 'red' ? false : true,
  }
}
