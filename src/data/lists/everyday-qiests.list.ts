import { GameModeInterface } from './../../entities/RoomEntity'

export type EveryDayQuestTypeType = 'playing' | 'receive-money' | 'spend-money' | 'wins' | 'kills'

export interface EveryDayQuestInterface {
  description: string
  reward: number
  type: EveryDayQuestTypeType
  regim?: GameModeInterface
  target: number
}

export const EveryDayQuestList: EveryDayQuestInterface[] = [
  {
    description: 'Убить 10 игроков в режиме "Захват флага"',
    reward: 200,
    type: 'kills',
    regim: 'capture the flag',
    target: 10,
  },
  {
    description: 'Одержать 3 победы в режиме "Захват кристалла"',
    reward: 150,
    type: 'wins',
    regim: 'crystal capture',
    target: 3,
  },
  {
    description: 'Потратить 500 кристаллов',
    reward: 320,
    type: 'spend-money',
    target: 500,
  },
  {
    description: 'Заработать 700 кристаллов',
    reward: 110,
    type: 'receive-money',
    target: 300,
  },
]
