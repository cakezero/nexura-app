// testing/positionData.js

const curves = ["Linear", "Exponential"];
const directions = ["Support", "Oppose"];
const accounts = [
  "0xAbc123...",
  "0xDef456...",
  "0xGhi789...",
  "0xJkl012...",
  "0xMno345...",
  "0xPqr678...",
  "0xStu901...",
];

const avatars = [
  "/avatar1.png",
  "/avatar2.png",
  "/avatar3.png",
  "/avatar4.png",
  "/avatar5.png",
];

export const samplePositions = Array.from({ length: 1000 }, (_, i) => {
  return {
    account: accounts[i % accounts.length],
    curve: curves[Math.floor(Math.random() * curves.length)],
    direction: directions[Math.floor(Math.random() * directions.length)],
    shares: Math.floor(Math.random() * 20) + 1,
    avatar: avatars[i % avatars.length],
  };
});