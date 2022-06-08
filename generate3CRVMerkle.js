const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const numberToBigNumber = (n, decimals) => {
    return ethers.utils.parseUnits(n.toString(), decimals);
};

const main = async () => {
    const THREE_CRV = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490";
    const bribes = [
        {
            gaugeName: "3CRV",
            token: "3CRV",
            symbol: '3CRV',
            image: "https://etherscan.io/token/images/3pool_32.png",
            address: THREE_CRV,
            amount: 83053.2057428181,
            decimals: 18,
        }
    ];

    const json = fs.readFileSync("./merkle_3crv_balancer_83k.json");
    const merkle = JSON.parse(json);

    const usersWhoNeedClaim = {
        [THREE_CRV]: []
    };
    for (const address of Object.keys(merkle.claims)) {
        const data = merkle.claims[address];
        usersWhoNeedClaim[THREE_CRV].push({
            account: address,
            amount: BigNumber.from(data.amount)
        });
    }

    // We generate the merkle tree
    // IMPORTANT 
    // Increment the index [0, ...] for each tokens
    const global = [];
    for (const tokenAddress of Object.keys(usersWhoNeedClaim)) {
        const bribe = bribes.find(b => b.address === tokenAddress);
        const usersEligible = usersWhoNeedClaim[tokenAddress];
        const users = [];

        for (let i = 0; i < usersEligible.length; i++) {
            users.push({
                index: i,
                address: usersEligible[i].account.toLowerCase(),
                amount: usersEligible[i].amount,
            });
        }

        // Check if all amounts <= total bribe
        let bn = BigNumber.from(0);
        for (const user of users) {
            bn = bn.add(user.amount);
        }

        // Total bribes
        const totalBribe = bribes.reduce((acc, bribe) => {
            if (bribe.address !== tokenAddress) {
                return acc;
            }

            return acc.add(numberToBigNumber(bribe.amount, bribe.decimals));
        }, BigNumber.from(0));

        if (bn.gt(totalBribe)) {
            console.error("Bribe " + bribe.gaugeName + " not correct");
            console.log("Total " + bn.toString());
            console.log("Max " + totalBribe.toString());
            exit(-1);
        }

        const elements = users.map((x) =>
            utils.solidityKeccak256(["uint256", "address", "uint256"], [x.index, x.address.toLowerCase(), x.amount])
        );

        const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

        let res = {};

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            res[user.address.toLowerCase()] = {
                index: user.index,
                amount: BigNumber.from(user.amount),
                proof: merkleTree.getHexProof(elements[i]),
            };
        }

        global.push({
            "symbol": bribe.symbol,
            "address": bribe.address,
            "image": bribe.image,
            "merkle": res,
            root: merkleTree.getHexRoot(),
        });
    }

    fs.writeFileSync('3CRVmerkle.json', JSON.stringify(global));
}

main();