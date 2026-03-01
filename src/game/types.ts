export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2D;
  angle: number;
  width: number;
  height: number;
  color: string;
}

export interface Car extends Entity {
  velocity: number;
  steering: number;
  health: number;
  maxSpeed: number;
}

export interface Building extends Entity {
  type: 'rect' | 'circle';
}

export interface GameState {
  player: Car;
  buildings: Building[];
  camera: Vector2D;
  wantedLevel: number;
  score: number;
  lastUpdate: number;
}
