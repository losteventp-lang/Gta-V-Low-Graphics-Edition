import { GameState, Car, Building } from './types';
import { 
  CAR_WIDTH, CAR_HEIGHT, CITY_SIZE, BUILDING_COUNT, 
  ACCELERATION, FRICTION, STEERING_SPEED, MAX_SPEED, REVERSE_MAX_SPEED 
} from './constants';

export const createInitialState = (): GameState => {
  const buildings: Building[] = [];
  
  // Simple procedural city generation
  for (let i = 0; i < BUILDING_COUNT; i++) {
    buildings.push({
      id: `b-${i}`,
      pos: {
        x: (Math.random() - 0.5) * CITY_SIZE,
        y: (Math.random() - 0.5) * CITY_SIZE,
      },
      angle: 0,
      width: 50 + Math.random() * 100,
      height: 50 + Math.random() * 100,
      color: '#7f8c8d',
      type: 'rect',
    });
  }

  return {
    player: {
      id: 'player',
      pos: { x: 0, y: 0 },
      angle: 0,
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      color: '#e74c3c',
      velocity: 0,
      steering: 0,
      health: 100,
      maxSpeed: MAX_SPEED,
    },
    buildings,
    camera: { x: 0, y: 0 },
    wantedLevel: 0,
    score: 0,
    lastUpdate: Date.now(),
  };
};

export const updateGame = (state: GameState, keys: Set<string>): GameState => {
  const newState = { ...state };
  const { player } = newState;

  // Input handling
  if (keys.has('ArrowUp') || keys.has('w')) {
    player.velocity += ACCELERATION;
  }
  if (keys.has('ArrowDown') || keys.has('s')) {
    player.velocity -= ACCELERATION;
  }
  
  // Steering
  if (Math.abs(player.velocity) > 0.1) {
    const steerDir = player.velocity > 0 ? 1 : -1;
    if (keys.has('ArrowLeft') || keys.has('a')) {
      player.angle -= STEERING_SPEED * steerDir;
    }
    if (keys.has('ArrowRight') || keys.has('d')) {
      player.angle += STEERING_SPEED * steerDir;
    }
  }

  // Physics
  player.velocity *= FRICTION;
  if (player.velocity > MAX_SPEED) player.velocity = MAX_SPEED;
  if (player.velocity < REVERSE_MAX_SPEED) player.velocity = REVERSE_MAX_SPEED;

  player.pos.x += Math.sin(player.angle) * player.velocity;
  player.pos.y -= Math.cos(player.angle) * player.velocity;

  // Simple collision with city boundaries
  const halfCity = CITY_SIZE / 2;
  if (Math.abs(player.pos.x) > halfCity) player.pos.x = Math.sign(player.pos.x) * halfCity;
  if (Math.abs(player.pos.y) > halfCity) player.pos.y = Math.sign(player.pos.y) * halfCity;

  // Camera follows player
  newState.camera = {
    x: player.pos.x,
    y: player.pos.y,
  };

  return newState;
};
