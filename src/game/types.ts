export type PlayerPerspective = 'A' | 'B' | 'C';

export type PhotoVersion =
  | 'thirty-students'
  | 'thirty-one-students'
  | 'empty-chair';

export type SceneId = 'section4b-photo';

export type GamePlayer = {
  discordUserId: string;
  perspective: PlayerPerspective;
};

export type SceneState = {
  sceneId: SceneId;
  photoVersion: PhotoVersion;
  photoTurned: boolean;
  photographInspected: boolean;
  storyFlags: Record<string, boolean>;
};

export type GameState = {
  sessionId: string;
  players: GamePlayer[];
  scene: SceneState;
};
