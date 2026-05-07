// Seed data for the Viessmann loyalty prototype.
// Products are reconstructed from the demo invoices in /resources/Invoices.
// Points-per-unit values are placeholders for the demo — the real program will define these per SPIFF campaign.

export const SEED_WHOLESALERS = [
  {
    oib: "76958388708",
    name: "Agria d.o.o.",
    address: "Kolodvorska 83",
    city: "31309 Karanac",
    iban: "HR3323600001234567890",
  },
  {
    oib: "00042324329",
    name: "Dinop d.o.o.",
    address: "Prigorska ulica 9",
    city: "10360 Soblinec",
    iban: "HR7124020061234500000",
  },
  {
    oib: "41278157868",
    name: "TERMOPROFI d.o.o.",
    address: "Puskariceva ulica 11E",
    city: "10250 Lucko",
    iban: "HR5623400091500678901",
  },
];

export const SEED_INSTALLERS = [
  {
    email: "ivo@instalaterm.hr",
    password: "demo1234",
    oib: "98765432109",
    companyName: "Instalaterm d.o.o.",
    address: "Savska cesta 18",
    city: "Zagreb",
    postalCode: "10000",
    role: "installer" as const,
  },
  {
    email: "marko@energomont.hr",
    password: "demo1234",
    oib: "11223344556",
    companyName: "Energo-Mont d.o.o.",
    address: "Vukovarska ulica 5",
    city: "Osijek",
    postalCode: "31000",
    role: "installer" as const,
  },
  {
    email: "ana@termoprojekt.hr",
    password: "demo1234",
    oib: "12345678901",
    companyName: "Termo-Projekt d.o.o.",
    address: "Ilica 42",
    city: "Zagreb",
    postalCode: "10000",
    role: "installer" as const,
  },
  {
    email: "admin@viessmann.com",
    password: "admin1234",
    oib: "00000000000",
    companyName: "Viessmann (admin)",
    address: "—",
    city: "—",
    postalCode: "—",
    role: "admin" as const,
  },
];

// Points scheme (placeholder for the demo):
// - Heat pumps (Vitocal): 500 pts/unit
// - Boilers (Vitodens, Vitotron, Vitoladens, Vitorondens, Vitocrossal): 300 pts/unit
// - Storage tanks (Vitocell): 100 pts/unit
// - Solar (Vitosol, Vitosolic): 250 pts/unit
// - AC (Vitoclima): 200 pts/unit
// - Smart controls (Vitoconnect, Vitotrol): 50 pts/unit
// - Sensors / accessories: 10 pts/unit
export const SEED_PRODUCTS = [
  // Vitodens — gas condensing boilers
  { family: "vitodens", model: "Vitodens 100-W B1KG 19kW", description: "Plinski kondenzacijski kombinirani kotao 19kW, 3.5\" Display", kpdSifra: "28.21.11", pointsPerUnit: 300 },
  { family: "vitodens", model: "Vitodens 200-W B2HH 19kW", description: "Plinski kondenzacijski cirkulacijski kotao 19kW, 3.5\" Display, WLAN", kpdSifra: "28.21.11", pointsPerUnit: 350 },
  { family: "vitodens", model: "Vitodens 222-W B2LH 19kW", description: "Kompaktni plinski kondenzacijski uredaj s PTV, 7\" Touch Display", kpdSifra: "28.21.11", pointsPerUnit: 400 },

  // Vitocal — heat pumps
  { family: "vitocal", model: "Vitocal 150-A 8.6kW", description: "Monoblok dizalica topline 8.6kW", kpdSifra: "28.21.13", pointsPerUnit: 500 },
  { family: "vitocal", model: "Vitocal 200-S R32 E10", description: "Split dizalica topline zrak/voda", kpdSifra: "28.21.13", pointsPerUnit: 500 },

  // Vitocell — storage tanks
  { family: "vitocell", model: "Vitocell 100-E 200L", description: "Buffer spremnik ogrjevne vode 200L", kpdSifra: "28.21.11", pointsPerUnit: 100 },
  { family: "vitocell", model: "Vitocell 100-E 300L", description: "Buffer spremnik 300L", kpdSifra: "28.21.11", pointsPerUnit: 120 },
  { family: "vitocell", model: "Vitocell 100-W CUGA 150L", description: "PTV spremnik 150L", kpdSifra: "28.21.11", pointsPerUnit: 80 },
  { family: "vitocell", model: "Vitocell 100-W CUGA 200L", description: "PTV spremnik 200L", kpdSifra: "28.21.11", pointsPerUnit: 100 },
  { family: "vitocell", model: "Vitocell 100-W 200L", description: "PTV spremnik 200L", kpdSifra: "28.21.11", pointsPerUnit: 100 },
  { family: "vitocell", model: "Vitocell 100-W 300L bivalentni", description: "PTV spremnik 300L bivalentni", kpdSifra: "28.21.11", pointsPerUnit: 130 },

  // Vitosol — solar
  { family: "vitosol", model: "Vitosol 100-FM", description: "Solarni paket za PTV, plocasti kolektor 2.5m2", kpdSifra: "28.21.14", pointsPerUnit: 250 },
  { family: "vitosol", model: "Vitosol 200-FM", description: "Solarni paket za PTV, plocasti kolektor", kpdSifra: "28.21.14", pointsPerUnit: 280 },
  { family: "vitosolic", model: "Vitosolic 100", description: "Solarna regulacija", kpdSifra: "28.21.19", pointsPerUnit: 30 },

  // Vitoclima — AC
  { family: "vitoclima", model: "Vitoclima 200-S 2.5kW", description: "Split klima 2.5kW unutarnja + vanjska", kpdSifra: "28.25.13", pointsPerUnit: 200 },
  { family: "vitoclima", model: "Vitoclima 200-S 3.5kW", description: "Split klima 3.5kW unutarnja + vanjska", kpdSifra: "28.25.13", pointsPerUnit: 220 },
  { family: "vitoclima", model: "Vitoclima 200-S 5.0kW", description: "Split klima 5.0kW unutarnja + vanjska", kpdSifra: "28.25.13", pointsPerUnit: 280 },

  // Vitoconnect — smart
  { family: "vitoconnect", model: "Vitoconnect OT2", description: "Internet sucelje za daljinsko upravljanje", kpdSifra: "26.20.16", pointsPerUnit: 50 },
  { family: "vitoconnect", model: "Viessmann with tado°", description: "Pametno upravljanje grijanjem", kpdSifra: "26.20.16", pointsPerUnit: 60 },

  // Vitotron — electric boiler
  { family: "vitotron", model: "Vitotron 100 VLN 12kW", description: "Zidni elektricni kotao 12kW", kpdSifra: "28.21.11", pointsPerUnit: 300 },

  // Sensors / accessories (Viessmann-branded)
  { family: "vitocell", model: "Osjetnik vanjske temperature ZK04306", description: "Vanjska sonda", kpdSifra: "28.21.19", pointsPerUnit: 10 },
  { family: "vitocell", model: "BUS spojni vod ZK02668 15m", description: "Komunikacijski kabel 15m", kpdSifra: "28.21.19", pointsPerUnit: 5 },
  { family: "vitocell", model: "Komplet za nadopunu ZK02163", description: "Nadopuna s nepovratnim ventilom", kpdSifra: "28.21.19", pointsPerUnit: 5 },
  { family: "vitocell", model: "Zidna konzola ZK06061", description: "Zidna konzola za vanjsku jedinicu", kpdSifra: "28.21.19", pointsPerUnit: 5 },
];

export const SEED_REWARDS = [
  { name: "Viessmann polo majica", description: "Brendirana polo majica, S-XXL", pointCost: 500, inventory: 50 },
  { name: "Set alata 12-dijelni", description: "Profesionalni set alata u koferu", pointCost: 2500, inventory: 20 },
  { name: "Tehnicki seminar Vitocal", description: "Jednodnevna obuka u Zagrebu", pointCost: 4000, inventory: 30 },
  { name: "Bauhaus poklon kartica 100€", description: "Vrijedi u svim Bauhaus poslovnicama", pointCost: 5000, inventory: 100 },
  { name: "iPhone 16 (puna nagrada)", description: "Najbolja nagrada za top-tier instaltere", pointCost: 50000, inventory: 5 },
];
