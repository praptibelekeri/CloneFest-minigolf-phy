// src/levels.js
export const levels = [
  {
    id: 1,
    par: 3,
    start: [0, 0.12, 0], // ball start
    hole: { pos: [6.5, 0, 0], radius: 0.25 },
    walls: [
      // only side boundaries, NO end wall
      { x: 0, z: -2.2, w: 10, d: 0.4 }, // left wall
      { x: 0, z: 2.2, w: 10, d: 0.4 },  // right wall
    ],
  },
  {
    id: 2,
    par: 4,
    start: [0, 0.12, 0],
    hole: { pos: [8, 0, 2], radius: 0.25 },
    walls: [
      // second hole: corridor with an angled obstacle
      { x: 0, z: -2.5, w: 12, d: 0.4 },
      { x: 0, z: 2.5, w: 12, d: 0.4 },
      { x: 4, z: 0, w: 0.4, d: 5 }, // vertical obstacle
    ],
  },
];
