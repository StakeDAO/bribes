const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");
const moment = require("moment");

const ENDPOINT_CLAIM_BRIBES = "https://api.thegraph.com/subgraphs/name/pierremarsotlyon1/bribesclaimv3";
const AGNOSTIC_ENDPOINT = "https://proxy.eu-02.agnostic.engineering/query";
const AGNOSTIC_API_KEY = "Fr2LXSVvKCfmXse8JQJiJBLHY9ujU3YZf8Kr6TDDh4Sw";

const CLAIM_BRIBES = gql`
query Bribes {
  lastClaimeds(first: 1000) {
    id
    addresses
    updated
    lastDistribution
  }
}
`;

const DATE_LAST_CLAIM_QUERY = `
SELECT
    timestamp
FROM evm_events_ethereum_mainnet
WHERE
    address = '0x03E34b085C52985F6a5D27243F20C84bDdc01Db4' and
    signature = 'Claimed(address,uint256,uint256,address,uint256)'
ORDER BY timestamp DESC
LIMIT 1
`;

const DATE_LAST_UPDATE_QUERY = (timestamp) => `
SELECT
    timestamp
FROM evm_events_ethereum_mainnet
WHERE
    address = '0x03E34b085C52985F6a5D27243F20C84bDdc01Db4' and
    timestamp < '${timestamp}' and
    signature = 'MerkleRootUpdated(address,bytes32,uint256)'
ORDER BY timestamp DESC
LIMIT 1
`;

const ALL_CLAIMED_QUERY = (since, end) => `
SELECT
    input_3_value_address as user,
    input_0_value_address as token
FROM evm_events_ethereum_mainnet
WHERE
    address = '0x03E34b085C52985F6a5D27243F20C84bDdc01Db4' and
    timestamp > '${since}' and
    timestamp <= '${end}' and
    signature = 'Claimed(address,uint256,uint256,address,uint256)'
ORDER BY timestamp DESC
`;

const agnosticFetch = async (query) => {
    try {
        const response = await axios.post(AGNOSTIC_ENDPOINT, query, {
            headers: {
                'Authorization': `${AGNOSTIC_API_KEY}`,
                "Cache-Control": "max-age=300"
            }
        });

        return response.data.rows;
    }
    catch (e) {
        console.error(e);
        return [];
    }
}

const getAllAccountClaimedSinceLastFreeze = async () => {
    const result = await request(ENDPOINT_CLAIM_BRIBES, CLAIM_BRIBES, null);
    return result.lastClaimeds;
};

const getAllAcountClaimedSinceLastFreezeWithAgnostic = async () => {
    const lastClaim = await agnosticFetch(DATE_LAST_CLAIM_QUERY);
    const lastUpdate = await agnosticFetch(DATE_LAST_UPDATE_QUERY(lastClaim[0][0]));

    const lastClaimTimestamp = lastClaim[0][0];
    const lastUpdateTimestamp = lastUpdate[0][0];
    
    // Get all claimed
    const allClaimed = await agnosticFetch(ALL_CLAIMED_QUERY(lastUpdateTimestamp, lastClaimTimestamp));
    
    // Create map token => users
    const resp = {};
    for(const claim of allClaimed) {
        const token = claim[1].toLowerCase();
        if(!resp[token]) {
            resp[token] = [];
        }

        resp[token].push(claim[0].toLowerCase());
    }
    
    return resp;
}

const main = async () => {
    // mapBribeRewards contains the reward amount of each users for each gauges bribed
    // Now, we have to know who claimed their rewards
    const claimedData = await getAllAccountClaimedSinceLastFreeze();

    // Organize it by tokens
    const claimedByTokens = {};
    for (const cd of claimedData) {
        if (!claimedByTokens[cd.id]) {
            claimedByTokens[cd.id.toLowerCase()] = [];
        }

        claimedByTokens[cd.id.toLowerCase()] = claimedByTokens[cd.id.toLowerCase()].concat(cd.addresses.map((a) => a.toLowerCase()));
    }

    const allClaimed = await getAllAcountClaimedSinceLastFreezeWithAgnostic();

    console.log(claimedByTokens)
    console.log(allClaimed)
}

main();