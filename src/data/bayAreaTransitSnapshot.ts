import type { TransitSnapshot } from "@/types/bayAreaTransit";

// Hand-authored seed (system.seed = true). This ships accurate but provisional
// BART structure — the six lines, core stations, and a few sample departure
// boards — so the page is useful before the first live refresh. Running
// `npm run update:bay-area-transit` replaces this file wholesale with the full
// ~50-station network and real-time departures from api.bart.gov.
export const bayAreaTransitSnapshot: TransitSnapshot = {
  "summary": {
    "system": {
      "name": "Bay Area Rapid Transit",
      "abbr": "BART",
      "source": "BART public API (api.bart.gov)",
      "feedTime": "Seed data — pending first live refresh",
      "generatedAt": "2026-06-09T12:00:00.000Z",
      "seed": true
    },
    "heroStats": {
      "lineCount": 6,
      "stationCount": 14,
      "activeAdvisories": 0,
      "elevatorOutages": 0,
      "trainsTracked": 12
    },
    "lines": [
      {
        "id": "coliseum-oakland-airport",
        "routeId": "ROUTE 19",
        "name": "Coliseum to Oakland Airport",
        "colorName": "Beige",
        "hexColor": "#d5cfa3",
        "origin": "COLS",
        "destination": "OAKL",
        "stationCount": 2
      },
      {
        "id": "dublin-pleasanton-daly-city",
        "routeId": "ROUTE 11",
        "name": "Dublin/Pleasanton to Daly City",
        "colorName": "Blue",
        "hexColor": "#0099cc",
        "origin": "DUBL",
        "destination": "DALY",
        "stationCount": 19
      },
      {
        "id": "berryessa-daly-city",
        "routeId": "ROUTE 5",
        "name": "Berryessa/North San José to Daly City",
        "colorName": "Green",
        "hexColor": "#339933",
        "origin": "BERY",
        "destination": "DALY",
        "stationCount": 21
      },
      {
        "id": "berryessa-richmond",
        "routeId": "ROUTE 3",
        "name": "Berryessa/North San José to Richmond",
        "colorName": "Orange",
        "hexColor": "#ff9933",
        "origin": "BERY",
        "destination": "RICH",
        "stationCount": 21
      },
      {
        "id": "richmond-millbrae-sfo",
        "routeId": "ROUTE 7",
        "name": "Richmond to Millbrae+SFO",
        "colorName": "Red",
        "hexColor": "#ff0000",
        "origin": "RICH",
        "destination": "MLBR",
        "stationCount": 22
      },
      {
        "id": "antioch-sfo-millbrae",
        "routeId": "ROUTE 1",
        "name": "Antioch to SFO/Millbrae",
        "colorName": "Yellow",
        "hexColor": "#ffff33",
        "origin": "ANTC",
        "destination": "MLBR",
        "stationCount": 24
      }
    ],
    "stations": [
      {
        "id": "12th",
        "abbr": "12TH",
        "name": "12th St. Oakland City Center",
        "city": "Oakland",
        "latitude": 37.803664,
        "longitude": -122.271604,
        "lines": ["Green", "Orange", "Red", "Yellow"]
      },
      {
        "id": "16th",
        "abbr": "16TH",
        "name": "16th St. Mission",
        "city": "San Francisco",
        "latitude": 37.765062,
        "longitude": -122.419694,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "19th",
        "abbr": "19TH",
        "name": "19th St. Oakland",
        "city": "Oakland",
        "latitude": 37.80787,
        "longitude": -122.269029,
        "lines": ["Green", "Orange", "Red", "Yellow"]
      },
      {
        "id": "balb",
        "abbr": "BALB",
        "name": "Balboa Park",
        "city": "San Francisco",
        "latitude": 37.721667,
        "longitude": -122.447508,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "cols",
        "abbr": "COLS",
        "name": "Coliseum",
        "city": "Oakland",
        "latitude": 37.753661,
        "longitude": -122.196869,
        "lines": ["Beige", "Green", "Orange"]
      },
      {
        "id": "civc",
        "abbr": "CIVC",
        "name": "Civic Center/UN Plaza",
        "city": "San Francisco",
        "latitude": 37.779732,
        "longitude": -122.414123,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "dbrk",
        "abbr": "DBRK",
        "name": "Downtown Berkeley",
        "city": "Berkeley",
        "latitude": 37.869867,
        "longitude": -122.268045,
        "lines": ["Orange", "Red"]
      },
      {
        "id": "embr",
        "abbr": "EMBR",
        "name": "Embarcadero",
        "city": "San Francisco",
        "latitude": 37.792976,
        "longitude": -122.396742,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "glen",
        "abbr": "GLEN",
        "name": "Glen Park",
        "city": "San Francisco",
        "latitude": 37.733064,
        "longitude": -122.433817,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "mcar",
        "abbr": "MCAR",
        "name": "MacArthur",
        "city": "Oakland",
        "latitude": 37.828415,
        "longitude": -122.267227,
        "lines": ["Green", "Orange", "Red", "Yellow"]
      },
      {
        "id": "mont",
        "abbr": "MONT",
        "name": "Montgomery St.",
        "city": "San Francisco",
        "latitude": 37.789256,
        "longitude": -122.401407,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "powl",
        "abbr": "POWL",
        "name": "Powell St.",
        "city": "San Francisco",
        "latitude": 37.784991,
        "longitude": -122.406857,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      },
      {
        "id": "sfia",
        "abbr": "SFIA",
        "name": "San Francisco Int'l Airport",
        "city": "San Francisco",
        "latitude": 37.616035,
        "longitude": -122.392612,
        "lines": ["Yellow", "Red"]
      },
      {
        "id": "24th",
        "abbr": "24TH",
        "name": "24th St. Mission",
        "city": "San Francisco",
        "latitude": 37.752254,
        "longitude": -122.418466,
        "lines": ["Blue", "Green", "Red", "Yellow"]
      }
    ],
    "advisories": [],
    "elevator": [],
    "defaultStation": "embr"
  },
  "stationBoards": {
    "embr": {
      "id": "embr",
      "abbr": "EMBR",
      "name": "Embarcadero",
      "departures": [
        {
          "destination": "Antioch",
          "destinationAbbr": "ANTC",
          "minutes": 2,
          "platform": "2",
          "direction": "North",
          "length": 10,
          "colorName": "Yellow",
          "hexColor": "#ffff33",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Richmond",
          "destinationAbbr": "RICH",
          "minutes": 5,
          "platform": "2",
          "direction": "North",
          "length": 8,
          "colorName": "Red",
          "hexColor": "#ff0000",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "SFO/Millbrae",
          "destinationAbbr": "MLBR",
          "minutes": 7,
          "platform": "1",
          "direction": "South",
          "length": 10,
          "colorName": "Yellow",
          "hexColor": "#ffff33",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Daly City",
          "destinationAbbr": "DALY",
          "minutes": 9,
          "platform": "1",
          "direction": "South",
          "length": 8,
          "colorName": "Blue",
          "hexColor": "#0099cc",
          "delaySeconds": 0,
          "bikesAllowed": true
        }
      ],
      "generatedAt": "2026-06-09T12:00:00.000Z"
    },
    "mont": {
      "id": "mont",
      "abbr": "MONT",
      "name": "Montgomery St.",
      "departures": [
        {
          "destination": "Berryessa",
          "destinationAbbr": "BERY",
          "minutes": 3,
          "platform": "1",
          "direction": "South",
          "length": 8,
          "colorName": "Green",
          "hexColor": "#339933",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Antioch",
          "destinationAbbr": "ANTC",
          "minutes": 4,
          "platform": "2",
          "direction": "North",
          "length": 10,
          "colorName": "Yellow",
          "hexColor": "#ffff33",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Millbrae",
          "destinationAbbr": "MLBR",
          "minutes": 8,
          "platform": "1",
          "direction": "South",
          "length": 8,
          "colorName": "Red",
          "hexColor": "#ff0000",
          "delaySeconds": 0,
          "bikesAllowed": true
        }
      ],
      "generatedAt": "2026-06-09T12:00:00.000Z"
    },
    "12th": {
      "id": "12th",
      "abbr": "12TH",
      "name": "12th St. Oakland City Center",
      "departures": [
        {
          "destination": "SFO/Millbrae",
          "destinationAbbr": "MLBR",
          "minutes": 1,
          "platform": "1",
          "direction": "South",
          "length": 10,
          "colorName": "Yellow",
          "hexColor": "#ffff33",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Richmond",
          "destinationAbbr": "RICH",
          "minutes": 6,
          "platform": "2",
          "direction": "North",
          "length": 8,
          "colorName": "Orange",
          "hexColor": "#ff9933",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Daly City",
          "destinationAbbr": "DALY",
          "minutes": 10,
          "platform": "1",
          "direction": "South",
          "length": 8,
          "colorName": "Green",
          "hexColor": "#339933",
          "delaySeconds": 0,
          "bikesAllowed": true
        }
      ],
      "generatedAt": "2026-06-09T12:00:00.000Z"
    },
    "mcar": {
      "id": "mcar",
      "abbr": "MCAR",
      "name": "MacArthur",
      "departures": [
        {
          "destination": "Richmond",
          "destinationAbbr": "RICH",
          "minutes": 2,
          "platform": "1",
          "direction": "North",
          "length": 8,
          "colorName": "Red",
          "hexColor": "#ff0000",
          "delaySeconds": 0,
          "bikesAllowed": true
        },
        {
          "destination": "Antioch",
          "destinationAbbr": "ANTC",
          "minutes": 5,
          "platform": "3",
          "direction": "North",
          "length": 10,
          "colorName": "Yellow",
          "hexColor": "#ffff33",
          "delaySeconds": 0,
          "bikesAllowed": true
        }
      ],
      "generatedAt": "2026-06-09T12:00:00.000Z"
    }
  }
};
