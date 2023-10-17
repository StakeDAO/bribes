const { parseAbi, createPublicClient, http } = require("viem");
const { mainnet } = require("viem/chains");
const merkles = require("./merkle.json");
const { utils, BigNumber } = require("ethers");
const { MerkleTree } = require("merkletreejs");
const fs = require('fs');
const keccak256 = require("keccak256");

const MERKLE_ADDRESS = "0x03E34b085C52985F6a5D27243F20C84bDdc01Db4";
const MS = "0xf930ebbd05ef8b25b1797b9b2109ddc9b0d43063";

const abi = parseAbi([
    'function isClaimed(address token, uint256 index) view returns(bool)',
    'function balanceOf(address user) view returns(uint256)',
]);

const TOKENS = [
    '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
    '0x6810e776880C02933D47DB1b9fc05908e5386b96', // GNO
    '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490', // 3CRV
];

const publicClient = createPublicClient({
    chain: mainnet,
    transport: http("https://mainnet.infura.io/v3/6376f2c1c1324b86a8529a71db9f3569"),
    batch: {
        multicall: true,
    }
});

const replaceMerkle = async () => {
    const newMerkles = [];

    const balanceOfCalls = [];
    for (const token of TOKENS) {
        balanceOfCalls.push({
            address: token,
            abi,
            functionName: 'balanceOf',
            args: [MERKLE_ADDRESS]
        });
    }

    const balanceOfResults = await publicClient.multicall({ contracts: balanceOfCalls });
    
    for (const token of TOKENS) {
        const merkle = merkles.find((m) => m.address.toLowerCase() === token.toLowerCase());
        if(!merkle) {
            throw new Error("Unknow merkle");
        }

        const balanceOf = balanceOfResults.shift();
        if (balanceOf.status === "failure") {
            throw new Error("Failure balanceOf");
        }

        const balance = BigNumber.from(balanceOf.result);
        const index = 0;
        const elements = [];
        elements.push(utils.solidityKeccak256(["uint256", "address", "uint256"], [index, MS.toLowerCase(), balance]));

        const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

        const merkleData = {};
        merkleData[MS.toLowerCase()] = {
            index,
            amount: balance,
            proof: merkleTree.getHexProof(elements[index]),
        };

        newMerkles.push({
            "symbol": merkle.symbol,
            "address": merkle.address,
            "image": merkle.image,
            "merkle": merkleData,
            root: merkleTree.getHexRoot(),
            "total": balance
        });
    }

    // Add other merkles
    for(const merkle of merkles) {
        let found = false;
        for(const token of TOKENS) {
            if(token.toLowerCase() === merkle.address.toLowerCase()) {
                found = true;
                break;
            }
        }

        if(found) {
            continue;
        }

        newMerkles.push(merkle);
    }

    fs.writeFileSync(`./replaceMerkle.json`, JSON.stringify(newMerkles));
}

const newMerkle = async () => {
    const newMerkles = [];

    for (const merkle of merkles) {
        // Check if the merkle is in the tokens array
        let found = false;
        for (const token of TOKENS) {
            if (token.toLowerCase() === merkle.address.toLowerCase()) {
                found = true;
                break;
            }
        }

        if (!found) {
            continue;
        }

        const isClaimedCalls = [];
        for (const user of Object.keys(merkle.merkle)) {
            isClaimedCalls.push({
                address: MERKLE_ADDRESS,
                abi,
                functionName: 'isClaimed',
                args: [merkle.address, merkle.merkle[user].index]
            });
        }

        const toClaim = [];
        const isClaimedResults = await publicClient.multicall({ contracts: isClaimedCalls });
        for (const user of Object.keys(merkle.merkle)) {
            const res = isClaimedResults.shift();
            if (res.status === "failure") {
                throw new Error("Failure isClaimed");
            }

            if (res.result === true) {
                continue;
            }

            toClaim.push({
                amount: BigNumber.from(merkle.merkle[user].amount),
                user,
            });
        }

        const elements = [];
        for (let i = 0; i < toClaim.length; i++) {
            const claim = toClaim[i];
            elements.push(utils.solidityKeccak256(["uint256", "address", "uint256"], [i, claim.user.toLowerCase(), claim.amount]));
        }

        const merkleTree = new MerkleTree(elements, keccak256, { sort: true });
        const merkleData = {};
        let totalAmount = BigNumber.from(0);
        for (let i = 0; i < toClaim.length; i++) {
            const claim = toClaim[i];
            totalAmount = totalAmount.add(claim.amount);

            merkleData[claim.user.toLowerCase()] = {
                index: i,
                amount: claim.amount,
                proof: merkleTree.getHexProof(elements[i]),
            };
        }

        newMerkles.push({
            "symbol": merkle.symbol,
            "address": merkle.address,
            "image": merkle.image,
            "merkle": merkleData,
            root: merkleTree.getHexRoot(),
            "total": totalAmount
        });
    }

    fs.writeFileSync(`./newMerkle.json`, JSON.stringify(newMerkles));
};

newMerkle();

