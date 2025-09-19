// src/levels.js
export const levels = [
  {
    id: 1,
    par: 2,
    start: [0, 0.12, 0],
    hole: { pos: [6, 0, 0], radius: 0.25 },
    walls: [
      { x: 0, z: -2.5, w: 12, d: 0.4, h: 0.5 }, // bottom
      { x: 0, z:  2.5, w: 12, d: 0.4, h: 0.5 }, // top
    ], // straight corridor, easy warmup
  },
  {
    id: 2,
    par: 3,
    start: [-5, 0.12, -3],
    hole: { pos: [5, 0, 3], radius: 0.25 },
    walls: [
      { x: 0,  z: -4.5, w: 12, d: 0.4, h: 0.5 }, // bottom
      { x: 0,  z:  4.5, w: 12, d: 0.4, h: 0.5 }, // top
      { x: -6, z: 0,    w: 0.4, d: 10, h: 0.5 }, // left
      { x:  6, z: 0,    w: 0.4, d: 10, h: 0.5 }, // right
    ], // diagonal shot inside a box
  },
  {
    id: 3,
    par: 3,
    start: [0, 0.12, -5],
    hole: { pos: [0, 0, 5], radius: 0.25 },
    walls: [
      { x: -3.5, z: 0, w: 0.4, d: 12, h: 0.5 }, // left wall
      { x:  3.5, z: 0, w: 0.4, d: 12, h: 0.5 }, // right wall
      { x: 0,    z: -6, w: 8,  d: 0.4, h: 0.5 }, // bottom cap
      { x: 0,    z:  6, w: 8,  d: 0.4, h: 0.5 }, // top cap
    ], // vertical lane, like bowling alley
  },
  {
    id: 4,
    par: 4,
    start: [-6, 0.12, 0],
    hole: { pos: [6, 0, 0], radius: 0.25 },
    walls: [
      { x: 0,  z: -3.5, w: 14, d: 0.4, h: 0.5 },
      { x: 0,  z:  3.5, w: 14, d: 0.4, h: 0.5 },
      { x: -7, z: 0,    w: 0.4, d: 7,  h: 0.5 },
      { x:  7, z: 0,    w: 0.4, d: 7,  h: 0.5 },
      // little gap in the middle makes it feel open
    ], // wide arena with hole opposite start
  },
  {
    id: 5,
    par: 5,
    start: [-5, 0.12, -5],
    hole: { pos: [5, 0, 5], radius: 0.25 },
    walls: [
      { x: 0,  z: -6, w: 14, d: 0.4, h: 0.5 }, // bottom
      { x: 0,  z:  6, w: 14, d: 0.4, h: 0.5 }, // top
      { x: -6, z: 0,  w: 0.4, d: 12, h: 0.5 }, // left
      { x:  6, z: 0,  w: 0.4, d: 12, h: 0.5 }, // right
      // square box, diagonal long shot
    ],
  },
];
