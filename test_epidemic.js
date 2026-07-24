import { epidemicService } from './src/services/EpidemicService.js';

console.log("Adding case 1...");
console.log(epidemicService.addCase({
  location: "Sector 62",
  epidemicCategory: "Gastrointestinal"
}));

console.log("Adding case 2...");
console.log(epidemicService.addCase({
  location: "Sector 62",
  epidemicCategory: "Gastrointestinal"
}));

console.log("Adding case 3...");
console.log(epidemicService.addCase({
  location: "Sector 62",
  epidemicCategory: "Gastrointestinal"
}));
