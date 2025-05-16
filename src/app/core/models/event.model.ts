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

export enum EventNames {
  "football" = "Football",
  "tennis" = "Tennis",
  "basketball" = "Basketball",
  "baseball" = "Baseball",
  "icehockey" = "Ice Hockey",
  "handball" = "Handball",
  "volleyball" = "Volleyball",
  "badminton" = "Badminton",
  "beachvolleyball" = "Beach Volleyball",
  "futsal" = "Futsal",
}
