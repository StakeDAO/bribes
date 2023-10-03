const sdfxs = require("./tmp/sdfxs.eth-delegationScoresWithoutVote.json");
const sdcrv = require("./tmp/sdcrv.eth-delegationScoresWithoutVote.json");
const sdbal = require("./tmp/sdbal.eth-delegationScoresWithoutVote.json");
const fs = require('fs');

let resp = "";
for (const addr of Object.keys(sdfxs)) {
    resp += addr + ";" + sdfxs[addr] + "\n";
}
fs.writeFileSync(`./vpfxs.csv`, resp);

resp = "";
for (const addr of Object.keys(sdcrv)) {
    resp += addr + ";" + sdcrv[addr] + "\n";
}
fs.writeFileSync(`./sdcrv.csv`, resp);

resp = "";
for (const addr of Object.keys(sdbal)) {
    resp += addr + ";" + sdbal[addr] + "\n";
}
fs.writeFileSync(`./sdbal.csv`, resp);
