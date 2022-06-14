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
    const SDT = "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F";
    const bribes = [
        {
            gaugeName: "SDT",
            token: "SDT",
            symbol: "SDT",
            image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
            address: SDT,
            amount: 58630.737167843166,
            decimals: 18,
        }
    ];

    const usersWhoNeedClaim = {
        [SDT]: [
            {
                account: "0x0397D4A6f9078884a1815f9dbE1e3fDcCfdc4C50",
                amount: numberToBigNumber(756.408087141159, 18)
            },
            {
                account: "0x1A162A5FdaEbb0113f7B83Ed87A43BCF0B6a4D1E",
                amount: numberToBigNumber(888.533396192017, 18)
            },
            {
                account: "0x210A3428D10bf9a68f339006141803f3513e976a",
                amount: numberToBigNumber(1075.031420849010, 18)
            },
            {
                account: "0x2f707265E61300e8290C18E38EbcBd129FB0B0F5",
                amount: numberToBigNumber(1156.248483326460, 18)
            },
            {
                account: "0x327aE09aefFc9a276529B61870E896E733933801",
                amount: numberToBigNumber(258.162890661804, 18)
            },
            {
                account: "0x3Ac892A09165516D98Ec9C02B95Ff840aB4bAdae",
                amount: numberToBigNumber(302.208476581209, 18)
            },
            {
                account: "0x48Fb55eD1Fb62ED26274fb805f6444bEa97c1F28",
                amount: numberToBigNumber(524.963830605607, 18)
            },
            {
                account: "0x946Fb1b69a0F53599CB685a9A12f870f280c5BD9",
                amount: numberToBigNumber(182.282194742385, 18)
            },
            {
                account: "0x95f1872c2c63f54072BD42F68BeEe71E0D6f67d3",
                amount: numberToBigNumber(3935.344921082660, 18)
            },
    
            {
                account: "0x9a17e9F6363907Cfa3da4ED7819914128f9a80c6",
                amount: numberToBigNumber(1699.978779900320, 18)
            },
            {
                account: "0xb0e83C2D71A991017e0116d58c5765Abc57384af",
                amount: numberToBigNumber(23259.181747013400, 18)
            },
            {
                account: "0xb957DccaA1CCFB1eB78B495B499801D591d8a403",
                amount: numberToBigNumber(87.105000000000, 18)
            },
            {
                account: "0xcfFeA940aE53725fFE834895c79ce3D2B5c0FF86",
                amount: numberToBigNumber(141.116291320055, 18)
            },
            {
                account: "0xd6e50CB0e646206231bBfb2c8424C1420152f005",
                amount: numberToBigNumber(4954.988413849980, 18)
            },
            {
                account: "0xD8de4C018fADB5a0CCcACB3eBd6A3Fe916f224f6",
                amount: numberToBigNumber(4371.947990358700, 18)
            },
            {
                account: "0xec70538bEac744eec5eDec4b329205a4b29Ba8AE",
                amount: numberToBigNumber(15037.235244218400, 18)
            }
        ]
    };


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
            console.log("Max   " + totalBribe.toString());
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

    fs.writeFileSync('merkleSDT.json', JSON.stringify(global));
}

main();