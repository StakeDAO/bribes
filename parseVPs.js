const crv = require("./tmp/sdcrv.eth-delegationScoresWithoutVote.json");
const bal = require("./tmp/sdbal.eth-delegationScoresWithoutVote.json");
const fxs = require("./tmp/sdfxs.eth-delegationScoresWithoutVote.json");
const fs = require('fs');

const main = () => {
    
    fs.writeFileSync(`./tmp/parse-sdcrv.eth-delegationScoresWithoutVote.json`, parse(crv));
    fs.writeFileSync(`./tmp/parse-sdbal.eth-delegationScoresWithoutVote.json`, parse(bal));
    fs.writeFileSync(`./tmp/parse-sdfxs.eth-delegationScoresWithoutVote.json`, parse(fxs));

};

const parse = (data) => {
    const keys = Object.keys(data);
    const resp = [];
    for(const key of keys) {
        resp.push(key+";"+data[key]);
    }

    return resp.join("\n");
}

main();