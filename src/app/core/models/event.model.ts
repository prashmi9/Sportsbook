import { MarketData } from "./market.model";
export interface EventId {
  id: number;
}

export interface TeamData {
  awayScore: number;
  awayTeam: string;
  homeScore: number;
  homeTeam: string;
  id: number;
  marketId: number;
  markets?: MarketData[];
}
