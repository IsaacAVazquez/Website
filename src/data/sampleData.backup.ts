import { Player, Position } from '@/types';

// Sample QB data for testing
export const sampleQBData: Player[] = [
  {
    id: "1",
    name: "Josh Allen",
    team: "BUF",
    position: "QB",
    averageRank: 1.2,
    projectedPoints: 380,
    standardDeviation: 0.4,
    expertRanks: [1, 1, 2, 1, 1]
  },
  {
    id: "2",
    name: "Jalen Hurts",
    team: "PHI",
    position: "QB",
    averageRank: 2.1,
    projectedPoints: 375,
    standardDeviation: 0.8,
    expertRanks: [2, 3, 1, 2, 2]
  },
  {
    id: "3",
    name: "Patrick Mahomes",
    team: "KC",
    position: "QB",
    averageRank: 2.8,
    projectedPoints: 370,
    standardDeviation: 1.1,
    expertRanks: [3, 2, 3, 4, 2]
  },
  {
    id: "4",
    name: "Lamar Jackson",
    team: "BAL",
    position: "QB",
    averageRank: 4.5,
    projectedPoints: 355,
    standardDeviation: 1.5,
    expertRanks: [4, 5, 4, 5, 4]
  },
  {
    id: "5",
    name: "Dak Prescott",
    team: "DAL",
    position: "QB",
    averageRank: 5.2,
    projectedPoints: 340,
    standardDeviation: 0.9,
    expertRanks: [5, 6, 5, 4, 6]
  },
  {
    id: "6",
    name: "Joe Burrow",
    team: "CIN",
    position: "QB",
    averageRank: 6.1,
    projectedPoints: 335,
    standardDeviation: 1.3,
    expertRanks: [6, 5, 7, 6, 7]
  },
  {
    id: "7",
    name: "Justin Herbert",
    team: "LAC",
    position: "QB",
    averageRank: 7.5,
    projectedPoints: 330,
    standardDeviation: 1.8,
    expertRanks: [7, 8, 6, 9, 7]
  },
  {
    id: "8",
    name: "Tua Tagovailoa",
    team: "MIA",
    position: "QB",
    averageRank: 8.3,
    projectedPoints: 325,
    standardDeviation: 1.4,
    expertRanks: [8, 7, 9, 8, 9]
  },
  {
    id: "9",
    name: "Trevor Lawrence",
    team: "JAX",
    position: "QB",
    averageRank: 9.8,
    projectedPoints: 310,
    standardDeviation: 2.1,
    expertRanks: [9, 10, 8, 11, 10]
  },
  {
    id: "10",
    name: "CJ Stroud",
    team: "HOU",
    position: "QB",
    averageRank: 10.5,
    projectedPoints: 305,
    standardDeviation: 1.9,
    expertRanks: [10, 11, 10, 9, 12]
  },
  {
    id: "11",
    name: "Jordan Love",
    team: "GB",
    position: "QB",
    averageRank: 12.2,
    projectedPoints: 295,
    standardDeviation: 2.5,
    expertRanks: [12, 13, 11, 14, 11]
  },
  {
    id: "12",
    name: "Jared Goff",
    team: "DET",
    position: "QB",
    averageRank: 13.5,
    projectedPoints: 290,
    standardDeviation: 1.7,
    expertRanks: [13, 12, 14, 13, 15]
  },
  {
    id: "13",
    name: "Kirk Cousins",
    team: "ATL",
    position: "QB",
    averageRank: 14.8,
    projectedPoints: 285,
    standardDeviation: 2.2,
    expertRanks: [14, 15, 13, 16, 14]
  },
  {
    id: "14",
    name: "Anthony Richardson",
    team: "IND",
    position: "QB",
    averageRank: 16.1,
    projectedPoints: 275,
    standardDeviation: 3.1,
    expertRanks: [15, 17, 16, 18, 14]
  },
  {
    id: "15",
    name: "Aaron Rodgers",
    team: "NYJ",
    position: "QB",
    averageRank: 17.5,
    projectedPoints: 270,
    standardDeviation: 2.8,
    expertRanks: [17, 16, 18, 17, 19]
  }
];

// Sample RB data
export const sampleRBData: Player[] = [
  {
    id: "16",
    name: "Christian McCaffrey",
    team: "SF",
    position: "RB",
    averageRank: 1.0,
    projectedPoints: 320,
    standardDeviation: 0.0,
    expertRanks: [1, 1, 1, 1, 1]
  },
  {
    id: "17",
    name: "Austin Ekeler",
    team: "LAC",
    position: "RB",
    averageRank: 2.4,
    projectedPoints: 300,
    standardDeviation: 0.5,
    expertRanks: [2, 3, 2, 2, 3]
  },
  {
    id: "18",
    name: "Bijan Robinson",
    team: "ATL",
    position: "RB",
    averageRank: 3.2,
    projectedPoints: 295,
    standardDeviation: 0.8,
    expertRanks: [3, 2, 4, 3, 4]
  },
  {
    id: "19",
    name: "Nick Chubb",
    team: "CLE",
    position: "RB",
    averageRank: 4.5,
    projectedPoints: 285,
    standardDeviation: 1.2,
    expertRanks: [4, 5, 3, 5, 5]
  },
  {
    id: "20",
    name: "Saquon Barkley",
    team: "NYG",
    position: "RB",
    averageRank: 5.8,
    projectedPoints: 275,
    standardDeviation: 1.5,
    expertRanks: [5, 6, 6, 7, 4]
  },
  {
    id: "21",
    name: "Tony Pollard",
    team: "DAL",
    position: "RB",
    averageRank: 7.1,
    projectedPoints: 265,
    standardDeviation: 1.8,
    expertRanks: [7, 8, 5, 8, 7]
  },
  {
    id: "22",
    name: "Jonathan Taylor",
    team: "IND",
    position: "RB",
    averageRank: 8.5,
    projectedPoints: 260,
    standardDeviation: 2.1,
    expertRanks: [8, 7, 9, 10, 8]
  },
  {
    id: "23",
    name: "Josh Jacobs",
    team: "LV",
    position: "RB",
    averageRank: 10.2,
    projectedPoints: 250,
    standardDeviation: 2.5,
    expertRanks: [10, 11, 8, 12, 10]
  },
  {
    id: "24",
    name: "Derrick Henry",
    team: "TEN",
    position: "RB",
    averageRank: 12.5,
    projectedPoints: 240,
    standardDeviation: 3.2,
    expertRanks: [12, 13, 11, 15, 11]
  },
  {
    id: "25",
    name: "Aaron Jones",
    team: "GB",
    position: "RB",
    averageRank: 14.8,
    projectedPoints: 230,
    standardDeviation: 2.8,
    expertRanks: [14, 15, 13, 17, 15]
  }
];

// Sample WR data for 2024/2025 season
export const sampleWRData: Player[] = [
  {
    id: "26",
    name: "CeeDee Lamb",
    team: "DAL",
    position: "WR",
    averageRank: 1.3,
    projectedPoints: 285,
    standardDeviation: 0.6,
    expertRanks: [1, 2, 1, 1, 2]
  },
  {
    id: "27",
    name: "Tyreek Hill",
    team: "MIA",
    position: "WR",
    averageRank: 2.1,
    projectedPoints: 280,
    standardDeviation: 0.8,
    expertRanks: [2, 1, 3, 2, 3]
  },
  {
    id: "28",
    name: "Ja'Marr Chase",
    team: "CIN",
    position: "WR",
    averageRank: 2.9,
    projectedPoints: 275,
    standardDeviation: 1.1,
    expertRanks: [3, 3, 2, 4, 1]
  },
  {
    id: "29",
    name: "Amon-Ra St. Brown",
    team: "DET",
    position: "WR",
    averageRank: 4.2,
    projectedPoints: 270,
    standardDeviation: 1.4,
    expertRanks: [4, 5, 4, 3, 5]
  },
  {
    id: "30",
    name: "A.J. Brown",
    team: "PHI",
    position: "WR",
    averageRank: 5.1,
    projectedPoints: 265,
    standardDeviation: 1.2,
    expertRanks: [5, 4, 6, 5, 4]
  },
  {
    id: "31",
    name: "Stefon Diggs",
    team: "HOU",
    position: "WR",
    averageRank: 6.3,
    projectedPoints: 260,
    standardDeviation: 1.8,
    expertRanks: [6, 7, 5, 8, 6]
  },
  {
    id: "32",
    name: "Davante Adams",
    team: "NYJ",
    position: "WR",
    averageRank: 7.5,
    projectedPoints: 255,
    standardDeviation: 2.1,
    expertRanks: [7, 6, 9, 7, 8]
  },
  {
    id: "33",
    name: "Puka Nacua",
    team: "LAR",
    position: "WR",
    averageRank: 8.2,
    projectedPoints: 250,
    standardDeviation: 2.5,
    expertRanks: [8, 9, 7, 9, 7]
  },
  {
    id: "34",
    name: "Chris Olave",
    team: "NO",
    position: "WR",
    averageRank: 9.6,
    projectedPoints: 245,
    standardDeviation: 2.3,
    expertRanks: [9, 8, 11, 10, 10]
  },
  {
    id: "35",
    name: "DK Metcalf",
    team: "SEA",
    position: "WR",
    averageRank: 10.8,
    projectedPoints: 240,
    standardDeviation: 2.7,
    expertRanks: [10, 12, 8, 12, 12]
  },
  {
    id: "36",
    name: "Garrett Wilson",
    team: "NYJ",
    position: "WR",
    averageRank: 11.4,
    projectedPoints: 235,
    standardDeviation: 2.2,
    expertRanks: [11, 10, 13, 11, 12]
  },
  {
    id: "37",
    name: "DeVonta Smith",
    team: "PHI",
    position: "WR",
    averageRank: 12.7,
    projectedPoints: 230,
    standardDeviation: 2.8,
    expertRanks: [12, 13, 10, 15, 13]
  },
  {
    id: "38",
    name: "DJ Moore",
    team: "CHI",
    position: "WR",
    averageRank: 13.9,
    projectedPoints: 225,
    standardDeviation: 2.4,
    expertRanks: [13, 11, 16, 13, 16]
  },
  {
    id: "39",
    name: "Mike Evans",
    team: "TB",
    position: "WR",
    averageRank: 15.1,
    projectedPoints: 220,
    standardDeviation: 3.1,
    expertRanks: [15, 16, 12, 17, 14]
  },
  {
    id: "40",
    name: "Amari Cooper",
    team: "BUF",
    position: "WR",
    averageRank: 16.5,
    projectedPoints: 215,
    standardDeviation: 3.4,
    expertRanks: [16, 14, 19, 16, 18]
  },
  {
    id: "41",
    name: "Keenan Allen",
    team: "CHI",
    position: "WR",
    averageRank: 17.8,
    projectedPoints: 210,
    standardDeviation: 3.2,
    expertRanks: [17, 18, 15, 20, 19]
  },
  {
    id: "42",
    name: "Tee Higgins",
    team: "CIN",
    position: "WR",
    averageRank: 18.7,
    projectedPoints: 205,
    standardDeviation: 3.6,
    expertRanks: [18, 17, 21, 18, 20]
  },
  {
    id: "43",
    name: "Calvin Ridley",
    team: "TEN",
    position: "WR",
    averageRank: 19.9,
    projectedPoints: 200,
    standardDeviation: 3.8,
    expertRanks: [19, 20, 17, 22, 21]
  },
  {
    id: "44",
    name: "Cooper Kupp",
    team: "LAR",
    position: "WR",
    averageRank: 21.2,
    projectedPoints: 195,
    standardDeviation: 4.1,
    expertRanks: [20, 19, 23, 21, 23]
  },
  {
    id: "45",
    name: "Terry McLaurin",
    team: "WAS",
    position: "WR",
    averageRank: 22.5,
    projectedPoints: 190,
    standardDeviation: 3.7,
    expertRanks: [22, 23, 20, 24, 24]
  },
  {
    id: "46",
    name: "Malik Nabers",
    team: "NYG",
    position: "WR",
    averageRank: 23.8,
    projectedPoints: 185,
    standardDeviation: 4.3,
    expertRanks: [23, 21, 26, 23, 25]
  },
  {
    id: "47",
    name: "Brandon Aiyuk",
    team: "SF",
    position: "WR",
    averageRank: 25.1,
    projectedPoints: 180,
    standardDeviation: 4.5,
    expertRanks: [24, 25, 24, 27, 26]
  },
  {
    id: "48",
    name: "Jayden Reed",
    team: "GB",
    position: "WR",
    averageRank: 26.4,
    projectedPoints: 175,
    standardDeviation: 4.2,
    expertRanks: [25, 24, 28, 26, 29]
  },
  {
    id: "49",
    name: "George Pickens",
    team: "PIT",
    position: "WR",
    averageRank: 27.7,
    projectedPoints: 170,
    standardDeviation: 4.8,
    expertRanks: [26, 28, 25, 30, 27]
  },
  {
    id: "50",
    name: "Marvin Harrison Jr.",
    team: "ARI",
    position: "WR",
    averageRank: 29.2,
    projectedPoints: 165,
    standardDeviation: 5.1,
    expertRanks: [27, 26, 32, 29, 31]
  }
];

// Sample TE data for 2024/2025 season
export const sampleTEData: Player[] = [
  {
    id: "51",
    name: "Travis Kelce",
    team: "KC",
    position: "TE",
    averageRank: 1.2,
    projectedPoints: 200,
    standardDeviation: 0.4,
    expertRanks: [1, 1, 2, 1, 1]
  },
  {
    id: "52",
    name: "Mark Andrews",
    team: "BAL",
    position: "TE",
    averageRank: 2.6,
    projectedPoints: 185,
    standardDeviation: 1.2,
    expertRanks: [2, 3, 1, 3, 4]
  },
  {
    id: "53",
    name: "Sam LaPorta",
    team: "DET",
    position: "TE",
    averageRank: 3.1,
    projectedPoints: 180,
    standardDeviation: 1.1,
    expertRanks: [3, 2, 4, 2, 3]
  },
  {
    id: "54",
    name: "Trey McBride",
    team: "ARI",
    position: "TE",
    averageRank: 4.5,
    projectedPoints: 175,
    standardDeviation: 1.8,
    expertRanks: [4, 5, 3, 5, 5]
  },
  {
    id: "55",
    name: "George Kittle",
    team: "SF",
    position: "TE",
    averageRank: 5.7,
    projectedPoints: 170,
    standardDeviation: 2.1,
    expertRanks: [5, 4, 7, 4, 8]
  },
  {
    id: "56",
    name: "Evan Engram",
    team: "JAX",
    position: "TE",
    averageRank: 6.9,
    projectedPoints: 165,
    standardDeviation: 2.3,
    expertRanks: [6, 7, 5, 8, 6]
  },
  {
    id: "57",
    name: "Kyle Pitts",
    team: "ATL",
    position: "TE",
    averageRank: 8.2,
    projectedPoints: 160,
    standardDeviation: 2.8,
    expertRanks: [7, 6, 10, 7, 11]
  },
  {
    id: "58",
    name: "Dalton Kincaid",
    team: "BUF",
    position: "TE",
    averageRank: 9.4,
    projectedPoints: 155,
    standardDeviation: 2.6,
    expertRanks: [8, 9, 8, 10, 9]
  },
  {
    id: "59",
    name: "T.J. Hockenson",
    team: "MIN",
    position: "TE",
    averageRank: 10.7,
    projectedPoints: 150,
    standardDeviation: 3.1,
    expertRanks: [9, 8, 12, 9, 13]
  },
  {
    id: "60",
    name: "David Njoku",
    team: "CLE",
    position: "TE",
    averageRank: 12.1,
    projectedPoints: 145,
    standardDeviation: 3.4,
    expertRanks: [10, 11, 11, 13, 12]
  },
  {
    id: "61",
    name: "Dallas Goedert",
    team: "PHI",
    position: "TE",
    averageRank: 13.5,
    projectedPoints: 140,
    standardDeviation: 3.2,
    expertRanks: [11, 10, 15, 12, 15]
  },
  {
    id: "62",
    name: "Jake Ferguson",
    team: "DAL",
    position: "TE",
    averageRank: 14.8,
    projectedPoints: 135,
    standardDeviation: 3.7,
    expertRanks: [12, 13, 13, 16, 14]
  },
  {
    id: "63",
    name: "Brock Bowers",
    team: "LV",
    position: "TE",
    averageRank: 16.2,
    projectedPoints: 130,
    standardDeviation: 4.1,
    expertRanks: [13, 12, 18, 15, 18]
  },
  {
    id: "64",
    name: "Tyler Higbee",
    team: "LAR",
    position: "TE",
    averageRank: 17.6,
    projectedPoints: 125,
    standardDeviation: 3.9,
    expertRanks: [14, 15, 16, 19, 17]
  },
  {
    id: "65",
    name: "Pat Freiermuth",
    team: "PIT",
    position: "TE",
    averageRank: 19.1,
    projectedPoints: 120,
    standardDeviation: 4.3,
    expertRanks: [15, 14, 20, 18, 20]
  }
];

// Sample K data for 2024/2025 season
export const sampleKData: Player[] = [
  {
    id: "66",
    name: "Harrison Butker",
    team: "KC",
    position: "K",
    averageRank: 1.3,
    projectedPoints: 135,
    standardDeviation: 0.8,
    expertRanks: [1, 2, 1, 1, 2]
  },
  {
    id: "67",
    name: "Justin Tucker",
    team: "BAL",
    position: "K",
    averageRank: 2.1,
    projectedPoints: 130,
    standardDeviation: 1.1,
    expertRanks: [2, 1, 3, 2, 3]
  },
  {
    id: "68",
    name: "Tyler Bass",
    team: "BUF",
    position: "K",
    averageRank: 3.4,
    projectedPoints: 125,
    standardDeviation: 1.6,
    expertRanks: [3, 4, 2, 4, 4]
  },
  {
    id: "69",
    name: "Brandon McManus",
    team: "GB",
    position: "K",
    averageRank: 4.7,
    projectedPoints: 120,
    standardDeviation: 1.9,
    expertRanks: [4, 3, 6, 3, 7]
  },
  {
    id: "70",
    name: "Jason Sanders",
    team: "MIA",
    position: "K",
    averageRank: 5.8,
    projectedPoints: 115,
    standardDeviation: 2.1,
    expertRanks: [5, 6, 4, 6, 5]
  },
  {
    id: "71",
    name: "Younghoe Koo",
    team: "ATL",
    position: "K",
    averageRank: 7.2,
    projectedPoints: 110,
    standardDeviation: 2.4,
    expertRanks: [6, 5, 8, 5, 9]
  },
  {
    id: "72",
    name: "Daniel Carlson",
    team: "LV",
    position: "K",
    averageRank: 8.5,
    projectedPoints: 105,
    standardDeviation: 2.7,
    expertRanks: [7, 8, 7, 9, 8]
  },
  {
    id: "73",
    name: "Chris Boswell",
    team: "PIT",
    position: "K",
    averageRank: 9.8,
    projectedPoints: 100,
    standardDeviation: 2.9,
    expertRanks: [8, 7, 11, 8, 11]
  },
  {
    id: "74",
    name: "Evan McPherson",
    team: "CIN",
    position: "K",
    averageRank: 11.1,
    projectedPoints: 95,
    standardDeviation: 3.2,
    expertRanks: [9, 10, 9, 12, 10]
  },
  {
    id: "75",
    name: "Jake Elliott",
    team: "PHI",
    position: "K",
    averageRank: 12.4,
    projectedPoints: 90,
    standardDeviation: 3.5,
    expertRanks: [10, 9, 13, 11, 14]
  }
];

// Sample DST data for 2024/2025 season
export const sampleDSTData: Player[] = [
  {
    id: "76",
    name: "San Francisco 49ers",
    team: "SF",
    position: "DST",
    averageRank: 1.4,
    projectedPoints: 140,
    standardDeviation: 0.9,
    expertRanks: [1, 2, 1, 1, 2]
  },
  {
    id: "77",
    name: "Dallas Cowboys",
    team: "DAL",
    position: "DST",
    averageRank: 2.2,
    projectedPoints: 135,
    standardDeviation: 1.2,
    expertRanks: [2, 1, 3, 2, 3]
  },
  {
    id: "78",
    name: "Buffalo Bills",
    team: "BUF",
    position: "DST",
    averageRank: 3.6,
    projectedPoints: 130,
    standardDeviation: 1.8,
    expertRanks: [3, 4, 2, 4, 4]
  },
  {
    id: "79",
    name: "Baltimore Ravens",
    team: "BAL",
    position: "DST",
    averageRank: 4.8,
    projectedPoints: 125,
    standardDeviation: 2.1,
    expertRanks: [4, 3, 6, 3, 6]
  },
  {
    id: "80",
    name: "Miami Dolphins",
    team: "MIA",
    position: "DST",
    averageRank: 6.1,
    projectedPoints: 120,
    standardDeviation: 2.4,
    expertRanks: [5, 6, 4, 7, 5]
  },
  {
    id: "81",
    name: "New York Jets",
    team: "NYJ",
    position: "DST",
    averageRank: 7.3,
    projectedPoints: 115,
    standardDeviation: 2.7,
    expertRanks: [6, 5, 9, 6, 8]
  },
  {
    id: "82",
    name: "Pittsburgh Steelers",
    team: "PIT",
    position: "DST",
    averageRank: 8.7,
    projectedPoints: 110,
    standardDeviation: 3.1,
    expertRanks: [7, 8, 7, 9, 9]
  },
  {
    id: "83",
    name: "Cleveland Browns",
    team: "CLE",
    position: "DST",
    averageRank: 10.2,
    projectedPoints: 105,
    standardDeviation: 3.4,
    expertRanks: [8, 7, 12, 8, 12]
  },
  {
    id: "84",
    name: "Philadelphia Eagles",
    team: "PHI",
    position: "DST",
    averageRank: 11.5,
    projectedPoints: 100,
    standardDeviation: 3.6,
    expertRanks: [9, 10, 10, 12, 10]
  },
  {
    id: "85",
    name: "Kansas City Chiefs",
    team: "KC",
    position: "DST",
    averageRank: 12.8,
    projectedPoints: 95,
    standardDeviation: 3.9,
    expertRanks: [10, 9, 14, 11, 13]
  }
];

// Sample Overall data with pre-defined tiers for draft board
export const sampleOverallData: Player[] = [
  // Tier 1 - Elite (picks 1-5)
  { ...sampleRBData[0], averageRank: 1, tier: 1 }, // Christian McCaffrey
  { ...sampleWRData[0], averageRank: 2, tier: 1 }, // CeeDee Lamb
  { ...sampleWRData[1], averageRank: 3, tier: 1 }, // Tyreek Hill
  { ...sampleRBData[1], averageRank: 4, tier: 1 }, // Austin Ekeler
  { ...sampleWRData[2], averageRank: 5, tier: 1 }, // Ja'Marr Chase
  
  // Tier 2 - Round 1 (picks 6-12)
  { ...sampleRBData[2], averageRank: 6, tier: 2 }, // Bijan Robinson
  { ...sampleWRData[3], averageRank: 7, tier: 2 }, // Amon-Ra St. Brown
  { ...sampleRBData[3], averageRank: 8, tier: 2 }, // Nick Chubb
  { ...sampleWRData[4], averageRank: 9, tier: 2 }, // A.J. Brown
  { ...sampleQBData[0], averageRank: 10, tier: 2 }, // Josh Allen
  { ...sampleRBData[4], averageRank: 11, tier: 2 }, // Saquon Barkley
  { ...sampleTEData[0], averageRank: 12, tier: 2 }, // Travis Kelce
  
  // Tier 3 - Round 2 (picks 13-24)
  { ...sampleWRData[5], averageRank: 13, tier: 3 }, // Stefon Diggs
  { ...sampleRBData[5], averageRank: 14, tier: 3 }, // Tony Pollard
  { ...sampleQBData[1], averageRank: 15, tier: 3 }, // Jalen Hurts
  { ...sampleWRData[6], averageRank: 16, tier: 3 }, // Davante Adams
  { ...sampleRBData[6], averageRank: 17, tier: 3 }, // Jonathan Taylor
  { ...sampleWRData[7], averageRank: 18, tier: 3 }, // Puka Nacua
  { ...sampleQBData[2], averageRank: 19, tier: 3 }, // Patrick Mahomes
  { ...sampleTEData[1], averageRank: 20, tier: 3 }, // Mark Andrews
  { ...sampleWRData[8], averageRank: 21, tier: 3 }, // Chris Olave
  { ...sampleRBData[7], averageRank: 22, tier: 3 }, // Josh Jacobs
  { ...sampleWRData[9], averageRank: 23, tier: 3 }, // DK Metcalf
  { ...sampleQBData[3], averageRank: 24, tier: 3 }, // Lamar Jackson
  
  // Tier 4 - Round 3 (picks 25-36)
  { ...sampleTEData[2], averageRank: 25, tier: 4 }, // Sam LaPorta
  { ...sampleWRData[10], averageRank: 26, tier: 4 }, // Garrett Wilson
  { ...sampleRBData[8], averageRank: 27, tier: 4 }, // Derrick Henry
  { ...sampleWRData[11], averageRank: 28, tier: 4 }, // DeVonta Smith
  { ...sampleQBData[4], averageRank: 29, tier: 4 }, // Dak Prescott
  { ...sampleWRData[12], averageRank: 30, tier: 4 }, // DJ Moore
  { ...sampleTEData[3], averageRank: 31, tier: 4 }, // Trey McBride
  { ...sampleRBData[9], averageRank: 32, tier: 4 }, // Aaron Jones
  { ...sampleQBData[5], averageRank: 33, tier: 4 }, // Joe Burrow
  { ...sampleWRData[13], averageRank: 34, tier: 4 }, // Mike Evans
  { ...sampleTEData[4], averageRank: 35, tier: 4 }, // George Kittle
  { ...sampleQBData[6], averageRank: 36, tier: 4 }, // Justin Herbert
  
  // Tier 5 - Round 4-5 (picks 37-60)
  { ...sampleWRData[14], averageRank: 37, tier: 5 }, // Amari Cooper
  { ...sampleQBData[7], averageRank: 38, tier: 5 }, // Tua Tagovailoa
  { ...sampleWRData[15], averageRank: 39, tier: 5 }, // Keenan Allen
  { ...sampleTEData[5], averageRank: 40, tier: 5 }, // Evan Engram
  { ...sampleWRData[16], averageRank: 41, tier: 5 }, // Tee Higgins
  { ...sampleQBData[8], averageRank: 42, tier: 5 }, // Trevor Lawrence
  { ...sampleWRData[17], averageRank: 43, tier: 5 }, // Calvin Ridley
  { ...sampleTEData[6], averageRank: 44, tier: 5 }, // Kyle Pitts
  { ...sampleWRData[18], averageRank: 45, tier: 5 }, // Cooper Kupp
  { ...sampleQBData[9], averageRank: 46, tier: 5 }, // CJ Stroud
  { ...sampleWRData[19], averageRank: 47, tier: 5 }, // Terry McLaurin
  { ...sampleTEData[7], averageRank: 48, tier: 5 }, // Dalton Kincaid
  
  // Tier 6 - Mid rounds (picks 61-84)
  { ...sampleWRData[20], averageRank: 49, tier: 6 }, // Malik Nabers
  { ...sampleQBData[10], averageRank: 50, tier: 6 }, // Jordan Love
  { ...sampleTEData[8], averageRank: 51, tier: 6 }, // T.J. Hockenson
  { ...sampleWRData[21], averageRank: 52, tier: 6 }, // Brandon Aiyuk
  { ...sampleQBData[11], averageRank: 53, tier: 6 }, // Jared Goff
  { ...sampleTEData[9], averageRank: 54, tier: 6 }, // David Njoku
  { ...sampleWRData[22], averageRank: 55, tier: 6 }, // Jayden Reed
  { ...sampleQBData[12], averageRank: 56, tier: 6 }, // Kirk Cousins
  { ...sampleWRData[23], averageRank: 57, tier: 6 }, // George Pickens
  { ...sampleTEData[10], averageRank: 58, tier: 6 }, // Dallas Goedert
  { ...sampleDSTData[0], averageRank: 59, tier: 6 }, // San Francisco 49ers
  { ...sampleWRData[24], averageRank: 60, tier: 6 }, // Marvin Harrison Jr.
];

// Function to get sample data by position
export function getSampleDataByPosition(position: Position): Player[] {
  switch (position) {
    case 'QB':
      return sampleQBData;
    case 'RB':
      return sampleRBData;
    case 'WR':
      return sampleWRData;
    case 'TE':
      return sampleTEData;
    case 'K':
      return sampleKData;
    case 'DST':
      return sampleDSTData;
    case 'FLEX':
      return [...sampleRBData, ...sampleWRData, ...sampleTEData]; // Combined skill positions
    case 'OVERALL':
      return sampleOverallData; // Return pre-tiered overall data
    default:
      return sampleQBData;
  }
}