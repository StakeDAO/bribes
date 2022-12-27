const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const numberToBigNumber = (n, decimals) => {
    let s = n.toString();
    let [left, right] = s.split(".");
    if(right.length > 8) {
        right = right.substring(0, 8);
    }
    return ethers.utils.parseUnits(left + "." + right, decimals);
};

const main = async () => {
    const WBTC = "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599";
    const bribes = [
        {
            gaugeName: "WBTC",
            token: "WBTC",
            symbol: "WBTC",
            image: "https://etherscan.io/token/images/wbtc_28.png?v=1",
            address: WBTC,
            amount: 189.530600,
            decimals: 8,
        }
    ];

    const usersWhoNeedClaim = {
        [WBTC]: [
            {
                account: "0xc517FC8de741e93F033357a7c9988F606067a4bd",
                amount: numberToBigNumber(41.033714080, 8)
            },
            {
                account: "0xcBC8788A1f624A9E8042198dca2b07f7fF6DcEf3",
                amount: numberToBigNumber(40.53068562307, 8)
            },
            {
                account: "0x603d2E097D59e0B33F1515d1f19e94E89234d871",
                amount: numberToBigNumber(38.48903664378, 8)
            },
            {
                account: "0xA489e9daf10cEd86811d59e4D00ce1b0DEC95f5e",
                amount: numberToBigNumber(13.30932128129, 8)
            },
            {
                account: "0x60b958A2571A21D2856ecC19dAAc91710B3AC669",
                amount: numberToBigNumber(11.28366543448, 8)
            },
            {
                account: "0x15977e15d7b24C76f94D2902970e0F0EEDd78618",
                amount: numberToBigNumber(6.81055228770, 8)
            },
            {
                account: "0x061d670bc7fEeDa42c79f124d3faAd758558a5A6",
                amount: numberToBigNumber(5.06911265936, 8)
            },
            {
                account: "0x0272Ec6B528511f6D6d10F034dF8eAB8eC2e6feC",
                amount: numberToBigNumber(3.73675125040, 8)
            },
            {
                account: "0xdf5D7312c229dd782BC1311cd98B57749E343C48",
                amount: numberToBigNumber(2.27396402112, 8)
            },
    
            {
                account: "0x5d1248F6a088896a3cBE344d5bE99d7C8b721966",
                amount: numberToBigNumber(2.24747740063, 8)
            },
            {
                account: "0xcCc3cE05B1D1B4E4A72e2052b98B1de8E60593E8",
                amount: numberToBigNumber(2.19525211815, 8)
            },
            {
                account: "0x67624E5bFEF752c524055482A88ca25771abD8f8",
                amount: numberToBigNumber(1.67951943505, 8)
            },
            {
                account: "0xed8f53219Eaae84D6AcBCDe2623E54a2283dF715",
                amount: numberToBigNumber(1.36052164009, 8)
            },
            {
                account: "0xb6B447bA23B8775bd201b8ce52179DEd13De1fe4",
                amount: numberToBigNumber(1.26274522565, 8)
            },
            {
                account: "0x5D0aC389c669D6EFE3BA96B9878d8156f180C539",
                amount: numberToBigNumber(1.21017356296, 8)
            },
            {
                account: "0x076C95c6cd2eb823aCC6347FdF5B3dd9b83511E4",
                amount: numberToBigNumber(1.20397886957, 8)
            }
            ,
            {
                account: "0x6A6CcF936E969703010dE0B87aAaA4ca1C663d76",
                amount: numberToBigNumber(1.12623250250, 8)
            },
            {
                account: "0xf4e262A2165527727CB51E6ecc0B103f14ac4CFC",
                amount: numberToBigNumber(1.12087212774, 8)
            },
            {
                account: "0x467E7CD27cE6fB89D25D18686D2f556edbF62650",
                amount: numberToBigNumber(1.04168424720, 8)
            },
            {
                account: "0x77bB54D1A67E0984C7EC6fCe25fADaC499c181E5",
                amount: numberToBigNumber(0.99557672978, 8)
            },
            {
                account: "0x262D52430EA8d9aa4bfbcC590C0918946485EF6a",
                amount: numberToBigNumber(0.82073907328, 8)
            },
            {
                account: "0x21f59001e8543fbd84fCACAdE38B1A06274F0cA3",
                amount: numberToBigNumber(0.78456982424, 8)
            },
            {
                account: "0xdf62f9F9e2Ac2400F1528832BB557476803D5d9e",
                amount: numberToBigNumber(0.66989788374, 8)
            },
            {
                account: "0x6330c0E50e86D9bB585d95daE8F261d7F6b7fCe3",
                amount: numberToBigNumber(0.66332854271, 8)
            },
            {
                account: "0x08E1a6b795829dbeb5CC730F40c2CCAa3EAde6F4",
                amount: numberToBigNumber(0.63033132908, 8)
            },
            {
                account: "0x5f2d21Bc72B8F190FD0d330F6cfdC0F8b7C3Fc8E",
                amount: numberToBigNumber(0.61938373432, 8)
            },
            {
                account: "0x8A1965889b12b041682450058640688e1c80bF07",
                amount: numberToBigNumber(0.54918248090, 8)
            },
            {
                account: "0xa6a56097d89E1e691BE57210d00e4608420DF26B",
                amount: numberToBigNumber(0.53376482656, 8)
            },
            {
                account: "0x0e41c9B548cf0545377AEEb693A6006172F1af81",
                amount: numberToBigNumber(0.52232821983, 8)
            },
            {
                account: "0xf2662F19C17400d57906661609ae38A69b3BF04E",
                amount: numberToBigNumber(0.50082996122, 8)
            },
            {
                account: "0xEd5Df620096B648Dec61C1DCB6d54187D4E74b64",
                amount: numberToBigNumber(0.49200193028, 8)
            },
            {
                account: "0x008AB049959cF875BEa7165dA3E1f74b5C2Dae77",
                amount: numberToBigNumber(0.48590738225, 8)
            },
            {
                account: "0x3ce4103e31f094D2e30Cd6129E3c3704ba5165C0",
                amount: numberToBigNumber(0.39016493738, 8)
            },
            {
                account: "0x7c74064a6f2a1307ADEc89F7Ef0Fb0c8588A310C",
                amount: numberToBigNumber(0.32281314111, 8)
            },
            {
                account: "0x8441198D5c0ce3a4f3DA14De7D2669a7b62fef9E",
                amount: numberToBigNumber(0.29347636523, 8)
            },
            {
                account: "0x7B83e8F25831fB5db94d0dA032D72d2a67F1bcb4",
                amount: numberToBigNumber(0.28479250754, 8)
            },
            {
                account: "0x299ace548ef2885F8E38EC10C55b052D1cdc121E",
                amount: numberToBigNumber(0.28033914929, 8)
            },
            {
                account: "0xbE12777E18660c776dC2501945224E0f3c933E41",
                amount: numberToBigNumber(0.27194000735, 8)
            },
            {
                account: "0x88a481B7274E9ab297c8845d14596Df5bE1CDa44",
                amount: numberToBigNumber(0.26019095360, 8)
            },
            {
                account: "0x8Da29a7b1f8a2F7c47F6A89caB6e4c76d3754581",
                amount: numberToBigNumber(0.25643044440, 8)
            },
            {
                account: "0x3F7865B5eC3e4e6F22650816e8Aa39D5f625893D",
                amount: numberToBigNumber(0.22567313361, 8)
            },
            {
                account: "0x337B1276627F0B0273f41b552097dF69f9E0E290",
                amount: numberToBigNumber(0.21749195796, 8)
            },
            {
                account: "0x3dD48AD861F0B77D1312F9C95A13e52871Ca95e0",
                amount: numberToBigNumber(0.17736570761, 8)
            },
            {
                account: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf",
                amount: numberToBigNumber(0.13069912727, 8)
            },
            {
                account: "0x7d1db31fC07a07D000600e2D8078D8a6bc4d71DE",
                amount: numberToBigNumber(0.12592042812, 8)
            },
            {
                account: "0x8699df387C948171aA64E6c455e13362b1904D69",
                amount: numberToBigNumber(0.11349811710, 8)
            },
            {
                account: "0xFC32dC291dDae5C456B9a756cC1009DD7AB80De2",
                amount: numberToBigNumber(0.10977076911, 8)
            },
            {
                account: "0xA6842838d3Dd82e43C5BEf5DC4C78e706ecd84A6",
                amount: numberToBigNumber(0.10273263024, 8)
            },
            {
                account: "0xfBf1E7E03aa02Fa8f9935A40aa90DD92A2AB7b4D",
                amount: numberToBigNumber(0.10170235971, 8)
            },
            {
                account: "0x42a60D2f2FfA2150C568010A8D425f0AAD284fd2",
                amount: numberToBigNumber(0.08527373576, 8)
            },
            {
                account: "0x912F6071c371C4571282081a2e55cBB0cB6d0fFf",
                amount: numberToBigNumber(0.08284862000, 8)
            },
            {
                account: "0x153D81f9bb57216a49bCfbe59f48B9fbeac7bB67",
                amount: numberToBigNumber(0.06405360824, 8)
            },
            {
                account: "0x350864DEfF8d331CeE1e30901b2Fc258AB29A338",
                amount: numberToBigNumber(0.05836003288, 8)
            },
            {
                account: "0x23CFd98F29A1B841B40b2d428525d4c38A2Aa74e",
                amount: numberToBigNumber(0.05035371781, 8)
            },
            {
                account: "0x626d8AA96FFB465299d938055F89Acd8E51197F8",
                amount: numberToBigNumber(0.04527140203, 8)
            },
            {
                account: "0x85b4D1E1CA8D6e26159A0B9bE13DE8C0614B6185",
                amount: numberToBigNumber(0.04321199745, 8)
            },
            {
                account: "0xc21471AC5924fa255385Ea59B01Aac7ffeaea87e",
                amount: numberToBigNumber(0.03005172210, 8)
            },
            {
                account: "0xEB18C95D461b49000084016A2FF5a07a735D1768",
                amount: numberToBigNumber(0.02426896966, 8)
            },
            {
                account: "0x0427EA9D3d28dD8D6bc9856eE53E0c3380A8441c",
                amount: numberToBigNumber(0.02415016100, 8)
            },
            {
                account: "0x60523Cd3F5CF0061C6f042545371Fa6ff8cD397B",
                amount: numberToBigNumber(0.01808861334, 8)
            },
            {
                account: "0xf797485cC069a3910cD5d0eB5E168eEB9e8b8b1b",
                amount: numberToBigNumber(0.01338805665, 8)
            },
            {
                account: "0x155A17F49964E0b6C21b4Dfe01E5F9e895E9E475",
                amount: numberToBigNumber(0.01321205026, 8)
            },
            {
                account: "0xF91377CC5d236b1fFAEb7c1970EE6C7F4CF7A41e",
                amount: numberToBigNumber(0.01141105835, 8)
            },
            {
                account: "0x45929f86f3C3C9B439c086A347386b593F82D3c0",
                amount: numberToBigNumber(0.01141104976, 8)
            },
            {
                account: "0xcB89E891c581FBE0bea4Fac2ba9829D816515a81",
                amount: numberToBigNumber(0.01095688678, 8)
            },
            {
                account: "0x797f8d22f931Dd422A30d710078C9f1843e11c5d",
                amount: numberToBigNumber(0.00834355950, 8)
            },
            {
                account: "0x51458F44F35ae8aF27E609090f9951042a6F0455",
                amount: numberToBigNumber(0.00589752584, 8)
            },
            {
                account: "0xf673191B51ba0F035422Cd0d07Ba0e68C8b34e91",
                amount: numberToBigNumber(0.00345539633, 8)
            },
            {
                account: "0xE1e5072de1d9B120Cc33C57EbADBCD33DBC6dD62",
                amount: numberToBigNumber(0.00250963293, 8)
            },
            {
                account: "0x781E67d85170826784E3Adb635af9829731d8CD7",
                amount: numberToBigNumber(0.00125481646, 8)
            },
            {
                account: "0x68B4683475747E28a83596e94b58187d452099Cf",
                amount: numberToBigNumber(0.00105228769, 8)
            },
            {
                account: "0xE967650829b407BA36cf88c0FCC1515b0E3C1F79",
                amount: numberToBigNumber(0.00075213505, 8)
            },
            {
                account: "0xb46698A692162A35B67dEffe327807015eA7c3D9",
                amount: numberToBigNumber(0.00071390180, 8)
            },
            {
                account: "0x076e0C2be3A778E002DEfB27f6DB84A8493Cf677",
                amount: numberToBigNumber(0.00053813463, 8)
            },
            {
                account: "0xC13Aa1d5Fa211D04B7dd87ae2f780151d47022cd",
                amount: numberToBigNumber(0.00043881305, 8)
            },
            {
                account: "0xd53104105B23EbA0Beb6504f417b11A324009239",
                amount: numberToBigNumber(0.00031228478, 8)
            },
            {
                account: "0x69Ed24795649c23F9C13BFE317432fe0e679f1F6",
                amount: numberToBigNumber(0.00028165278, 8)
            },
            {
                account: "0x3A2EB9173697E99B4A45Cfb4fFB185652030796a",
                amount: numberToBigNumber(0.00021045754, 8)
            },
            {
                account: "0x0ECE7c1BfC9543B2cbeA8F5577d02E5f59a9f176",
                amount: numberToBigNumber(0.00011315256, 8)
            },
            {
                account: "0x739ef16A2031a2023554a6C8F3f2aa50ceF19582",
                amount: numberToBigNumber(0.00011066619, 8)
            },
            {
                account: "0x6F30f55D6C8dBCa8F010DAdB03A8366E6ba7e548",
                amount: numberToBigNumber(0.00005261438, 8)
            },
            {
                account: "0x6Ae7bf291028CCf52991BD020D2Dc121b40bce2A",
                amount: numberToBigNumber(0.00005261438, 8)
            },
            {
                account: "0x891f6A4717B4105A38d747463EEB07bdb4D72Ef4",
                amount: numberToBigNumber(0.00004640667, 8)
            },
            {
                account: "0x6c16a34850e994074c6024F48eB0219d786C1620",
                amount: numberToBigNumber(0.00002797462, 8)
            },
            {
                account: "0xCA24bEE3d0705c0b4c78016Be9E3aE05E5562445",
                amount: numberToBigNumber(0.00001389452, 8)
            },
            {
                account: "0x896022620cA215a0E5C8510095f194f46C3470Db",
                amount: numberToBigNumber(0.00000393085, 8)
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

    fs.writeFileSync('merkleWBTC.json', JSON.stringify(global));
}

main();