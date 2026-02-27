import fs from 'fs';

const zdenci = JSON.parse(fs.readFileSync('future_improvements/javni_zdenci.geojson', 'utf-8'));
console.log("Zdenci keys:", Object.keys(zdenci.features[0].properties));

const pjesacka = JSON.parse(fs.readFileSync('future_improvements/Geoportal_pjesacka_zona.geojson', 'utf-8'));
console.log("Pjesacka keys:", Object.keys(pjesacka.features[0].properties));

const wifi = JSON.parse(fs.readFileSync('future_improvements/Geoportal_besplatna_wifi_mreza.geojson', 'utf-8'));
console.log("WiFi keys:", Object.keys(wifi.features[0].properties));
