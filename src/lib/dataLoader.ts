import { Player } from "@/types";
import { sampleQBData, sampleRBData, sampleWRData, sampleTEData, sampleKData, sampleDSTData } from "@/data/sampleData";

export function loadAllPlayers(): Player[] {
  const allPlayers = [
    ...sampleQBData,
    ...sampleRBData,
    ...sampleWRData,
    ...sampleTEData,
    ...sampleKData,
    ...sampleDSTData,
  ];

  return allPlayers;
}

export function loadPlayersByPosition(position: string): Player[] {
  const players = loadAllPlayers();
  return players.filter(p => p.position === position);
}

export function getPlayerById(id: string): Player | undefined {
  const players = loadAllPlayers();
  return players.find(p => p.id === id);
}