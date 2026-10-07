import type { GameState, PlayerPerspective } from './types';

export const DEMO_SESSION_ID = 'SECTION-4B-DEMO';

export const DEMO_PLAYERS: Record<string, PlayerPerspective> = {
  'player-a': 'A',
  'player-b': 'B',
  'player-c': 'C',
};

export function createInitialGameState(): GameState {
  return {
    sessionId: DEMO_SESSION_ID,
    players: [
      {
        discordUserId: 'player-a',
        perspective: 'A',
      },
      {
        discordUserId: 'player-b',
        perspective: 'B',
      },
      {
        discordUserId: 'player-c',
        perspective: 'C',
      },
    ],
    scene: {
      sceneId: 'section4b-photo',
      photoVersion: 'thirty-students',
      photoTurned: false,
      photographInspected: false,
      storyFlags: {},
    },
  };
}
