const { BigNumber } = require("ethers");
const lastMerkle = require("./merkle.json");

//console.log(lastMerkle.map((m) => m.address));

for (const m of lastMerkle) {
    let total = BigNumber.from(0);
    for (const key of Object.keys(m.merkle)) {
        total = total.add(BigNumber.from(m.merkle[key].amount));
    }

    if (!BigNumber.from(m.total).eq(total)) {
        console.log("error ", m.symbol);
    }
}