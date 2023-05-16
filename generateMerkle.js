const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");
const moment = require("moment");

// LAST MERKLE
const lastMerkle = require("./lastMerkle.json");
const { parseUnits } = require("ethers/lib/utils");

const SDT_ADDRESS = "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F";
const SD_CRV = "0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5";
const SDBAL = "0xF24d8651578a55b0C119B9910759a351A3458895";
const SDFXS = "0x402F878BDd1f5C66FdAF0fabaBcF74741B68ac36";
const SDANGLE = "0x752B4c6e92d96467fE9b9a2522EF07228E00F87c";

const DELEGATION_PREFIX = "delegation-";
const DELEGATION_EXTRA_REWARD_PREFIX = "@";
const ENDPOINT = "https://hub.snapshot.org/graphql";
const ENDPOINT_DELEGATORS = "https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot";
const ENDPOINT_CLAIM_BRIBES = "https://api.thegraph.com/subgraphs/name/pierremarsotlyon1/bribesclaimv3";
const DELEGATION_ADDRESS = "0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC";
const SDT_IMAGE = "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011";

const AGNOSTIC_ENDPOINT = "https://proxy.eu-02.agnostic.engineering/query";
const AGNOSTIC_API_KEY = "Fr2LXSVvKCfmXse8JQJiJBLHY9ujU3YZf8Kr6TDDh4Sw";

const QUERY_VOTES = gql`
	query Proposal(
		$proposal: String!
		$orderBy: String
		$orderDirection: OrderDirection
    $created: Int
	) {
		votes(
      first: 1000
			where: { proposal: $proposal, vp_gt: 0, created_lt: $created }
			orderBy: $orderBy
			orderDirection: $orderDirection
		) {
			id
			ipfs
			voter
			created
			choice
			vp
			vp_by_strategy
		}
	}
`;

const QUERY_PROPOSAL = gql`
	query Proposal(
		$id: String!
	) {
    proposal(id: $id) {
			id
			ipfs
			title
			body
			start
			end
			state
			author
			created
			choices
			snapshot
			type
			strategies {
				name
				params
			}
			space {
				id
				name
				members
				avatar
				symbol
			}
			scores_state
			scores_total
			scores
			votes
		}
	}
`;

const DELEGATIONS_QUERY = gql`
query Proposal(
  $skip: Int
  $timestamp: Int
  $space: String
  ) {
  delegations(first: 1000 skip: $skip where: { 
    space: $space 
    delegate:"0x52ea58f4fc3ced48fa18e909226c1f8a0ef887dc"
    timestamp_lte: $timestamp
  }) {
    delegator
    space
    delegate
  }
}
`;

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

const getAllDelegators = async (timestamp, space) => {
  let delegatorAddresses = [];
  let run = true;
  let skip = 0;

  // Fetch all data
  do {
    const result = await request(ENDPOINT_DELEGATORS, DELEGATIONS_QUERY, { space, skip, timestamp });

    if (result.delegations?.length > 0) {
      delegatorAddresses = delegatorAddresses.concat(result.delegations.map((d) => d.delegator));
      skip += 1000;
    }
    else {
      run = false;
    }

  } while (run);

  return delegatorAddresses;
};

const getAllAccountClaimedSinceLastFreeze = async () => {
  const result = await request(ENDPOINT_CLAIM_BRIBES, CLAIM_BRIBES, null);
  return result.lastClaimeds;
};

const getAllAccountClaimedSinceLastFreezeWithAgnostic = async () => {
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

/**
 * Get all votes for a proposal
 */
const getVotes = async (idProposal) => {
  let votes = [];
  let run = true;
  let created = null

  // Fetch all data
  do {
    let params = {
      proposal: idProposal,
      orderBy: "created",
      orderDirection: "desc",
    };

    if (created) {
      params["created"] = created;
    }

    const result = await request(ENDPOINT, QUERY_VOTES, params);

    if (result.votes?.length > 0) {
      votes = votes.concat(result.votes);
      created = result.votes[result.votes.length - 1].created;
    }
    else {
      run = false;
    }

  } while (run);

  return votes;
}

/**
 * Fetch proposal data
 */
const getProposal = async (idProposal) => {
  const result = await request(ENDPOINT, QUERY_PROPOSAL, {
    id: idProposal,
  });
  return result.proposal;
}

const getScores = async (proposal, votes, voters) => {
  const { data } = await axios.post(
    "https://score.snapshot.org/api/scores",
    {
      params: {
        network: "1",
        snapshot: parseInt(proposal.snapshot),
        strategies: proposal.strategies,
        space: proposal.space.id,
        addresses: voters
      },
    },
  );

  const scores = votes.map((vote) => {
    let vp = 0;
    if (vote.vp > 0) {
      vp = vote.vp;
    } else {
      vp = data?.result?.scores?.[0]?.[vote.voter] || data?.result?.scores?.[1]?.[vote.voter];
    }
    return { ...vote, vp };
  });

  return orderBy(scores, "vp", "desc");
}

const getDelegationScores = async (proposal, voters) => {
  const { data } = await axios.post(
    "https://score.snapshot.org/api/scores",
    {
      params: {
        network: "1",
        snapshot: parseInt(proposal.snapshot),
        strategies: proposal.strategies,
        space: proposal.space.id,
        addresses: voters
      },
    },
  );

  return { ...data?.result?.scores[0], ...data?.result?.scores[1] };
}

const numberToBigNumber = (n, decimals) => {
  return ethers.utils.parseUnits(n.toString(), decimals);
};

const bribesRun = async (idProposal, space, bribes, delegationRewards, otcDelegation) => {

  // Create a map of bribe's names
  const mapNameBribes = {};
  const mapBribesVotes = {};
  const mapBribeRewards = {};

  // Get all votes for a specific gauge vote
  const votes = await getVotes(idProposal);

  // Get proposal
  const proposal = await getProposal(idProposal);

  // Get all votes
  const voters = votes.map((v) => v.voter);

  fs.writeFileSync(`tmp/${space}-voters.json`, JSON.stringify(voters));


  const scores = await getScores(proposal, votes, voters);
  fs.writeFileSync(`tmp/${space}-scores.json`, JSON.stringify(scores));

  // Get all delegator addresses
  const delegatorAddresses = await getAllDelegators(proposal.created, space);

  let delegationScores = await getDelegationScores(proposal, delegatorAddresses.concat([DELEGATION_ADDRESS]));

  // Share voting power of delegation address
  if (delegationScores[DELEGATION_ADDRESS] > 0) {
    const votingPowerToShare = delegationScores[DELEGATION_ADDRESS];
    delete delegationScores[DELEGATION_ADDRESS];

    const totalVp = Object.values(delegationScores).reduce((acc, a) => acc + a, 0.0);
    for (const key of Object.keys(delegationScores)) {
      const vp = delegationScores[key];
      const share = vp * 100 / totalVp;
      delegationScores[key] += votingPowerToShare * share / 100;
    }
  }
  delete delegationScores[DELEGATION_ADDRESS];

  fs.writeFileSync(`tmp/${space}-test_delegationScores.json`, JSON.stringify(delegationScores));

  // toLowerCase on all delegation addresses
  const delegationScoresClone = { ...delegationScores };
  delegationScores = {};
  for (const voter of Object.keys(delegationScoresClone)) {
    delegationScores[voter.toLowerCase()] = delegationScoresClone[voter];
  }

  // Remove from delegation scores where users voted directly
  // Example, i have 2000 vp and i vote in our UI with 1000 vp for a specific gauge
  // The delegation have not 2000 vp but 1000 vp
  for (const score of scores) {
    if (!delegationScores[score.voter.toLowerCase()]) {
      continue;
    }

    delegationScores[score.voter.toLowerCase()] = delegationScores[score.voter.toLowerCase()] - score.vp;
    if (delegationScores[score.voter.toLowerCase()] === 0) {
      delete delegationScores[score.voter.toLowerCase()];
    }
  }

  fs.writeFileSync(`tmp/${space}-delegationScoresWithoutVote.json`, JSON.stringify(delegationScores));

  // Get only gauges where we have bribes
  for (let i = 0; i < proposal.choices.length; i++) {
    const choice = proposal.choices[i];
    const bribe = bribes.find(b => b.gaugeName === choice);
    if (bribe) {
      mapNameBribes[i + 1] = choice;
      mapBribesVotes[choice] = [];
    }
  }

  const gaugesIndex = Object.keys(mapNameBribes).map(k => parseInt(k));

  // For each scores (ie : users who voted)
  // We get only them where we have bribes
  for (const score of scores) {
    // Calculate the total weight
    // For example : choice: { '2': 2, '41': 1, '53': 1 },
    // totalWeight = 4
    let totalWeight = 0.0;
    for (const key of Object.keys(score.choice)) {
      totalWeight += score.choice[key];
    }

    for (const key of Object.keys(score.choice)) {
      if (gaugesIndex.indexOf(parseInt(key)) > -1) {
        // Use voted for a gauge where we have a bribe
        // Save it
        // Calculate the weight associated to the vote based on the total voting power to the user
        // Example : if a have 2000 in voting power and i voted for 2 gauges at 50/50
        // I will have 1000 in weight for each

        mapBribesVotes[mapNameBribes[parseInt(key)]].push({
          weight: parseFloat(score.choice[key]) * 100 / totalWeight * score.vp / 100,
          voter: score.voter.toLowerCase(),
        });
      }
    }
  }

  fs.writeFileSync(`tmp/${space}-mapBribesVotes.json`, JSON.stringify(mapBribesVotes));


  // We have to integrate delegation addresses
  // They share rewards of each gauges
  /*for (const delegationAddress of Object.keys(delegationScores)) {
    const totalDelegationWeight = delegationScores[delegationAddress];
  
    for (const bribe of bribes) {
      if (bribe.delegationAmount === undefined || bribe.delegationAmount === null) {
        continue;
      }
  
      const voters = mapBribesVotes[bribe.gaugeName];
      let found = false;
      for (const voter of voters) {
        if (voter.voter === delegationAddress.toLowerCase()) {
          voter.weight += totalDelegationWeight;
          found = true;
          break;
        }
      }
  
      if (!found) {
        mapBribesVotes[bribe.gaugeName].push({
          weight: totalDelegationWeight,
          voter: delegationAddress.toLowerCase(),
        });
      }
    }
  }*/

  // Remove delegation address
  for (const gaugeKey of Object.keys(mapBribesVotes)) {
    const newVoters = [];
    for (const voter of mapBribesVotes[gaugeKey]) {
      if (voter.voter.toLowerCase() !== DELEGATION_ADDRESS.toLowerCase()) {
        newVoters.push(voter);
      }
    }

    mapBribesVotes[gaugeKey] = newVoters;
  }

  fs.writeFileSync(`tmp/${space}-mapBribesVotes.json`, JSON.stringify(mapBribesVotes));


  // Now, we have for each voters, the corresponding weight associated
  // We have to calculate their rewards
  for (const bribeName of Object.keys(mapBribesVotes)) {
    const bribe = bribes.find(b => b.gaugeName === bribeName);
    const votes = mapBribesVotes[bribeName];

    // Calculate the total weight for all users
    const totalWeight = votes.reduce((acc, v) => acc + v.weight, 0.0);

    //const totalVotingPowerDelegation = Object.values(delegationScores).reduce((acc, v) => acc + v, 0);

    // We have the total weight + the weight of each voters
    // We can calculate the reward amount for each of them
    mapBribeRewards[bribeName] = [];
    for (const vote of votes) {
      const percentageWeight = vote.weight * 100 / totalWeight;
      const rewardAmount = percentageWeight * bribe.amount / 100;

      mapBribeRewards[bribeName].push({
        voter: vote.voter.toLowerCase(),
        amount: numberToBigNumber(rewardAmount.toFixed(6), bribe.decimals),
        amountNumber: rewardAmount.toFixed(6),
      });
    }
  }

  // Now add delegation addresses
  const totalDelegationVotingPower = Object.values(delegationScores).reduce((acc, vp) => acc + vp, 0.0);
  for (const delegationAddress of Object.keys(delegationScores)) {
    const percentageWeight = delegationScores[delegationAddress] * 100 / totalDelegationVotingPower;
    const rewardAmount = percentageWeight * delegationRewards / 100;

    mapBribeRewards[DELEGATION_PREFIX + delegationAddress] = [{
      voter: delegationAddress.toLowerCase(),
      amount: numberToBigNumber(rewardAmount.toFixed(6), 18), // SDT
      amountNumber: rewardAmount.toFixed(6),
      tokenAddress: bribes[0]?.address || SDT_ADDRESS,
    }];
  }

  // Add extra rewards delegation
  for (const extraReward of otcDelegation) {
    for (const delegationAddress of Object.keys(delegationScores)) {
      const percentageWeight = delegationScores[delegationAddress] * 100 / totalDelegationVotingPower;
      const rewardAmount = percentageWeight * extraReward.amount / 100;
      mapBribeRewards[DELEGATION_PREFIX + delegationAddress + DELEGATION_EXTRA_REWARD_PREFIX + extraReward.address] = [{
        voter: delegationAddress.toLowerCase(),
        amount: numberToBigNumber(rewardAmount.toFixed(6), extraReward.decimals),
        amountNumber: rewardAmount.toFixed(6),
      }];
    }
  }

  fs.writeFileSync(`tmp/${space}-mapBribeRewards.json`, JSON.stringify(mapBribeRewards));
  return mapBribeRewards;
};

const main = async () => {

  /*********** Inputs ********/
  const crvIdProposal = "0x165dfc1ebc20598d3af86d39b81db41036c28ff443ed929f2dcf2aa0a77140c5";
  const balIdProposal = "0xbfe66f6b16fb66043e9d6462a901dd209108abfddc4b5e173abecfc52bb9b038";
  const fraxIdProposal = "0xc6f43ca59d730cc1dbd04009f38d75c3e6d0e593830299a11a596be88b5b8ead";
  const angleIdProposal = "0x4351f651cb2a6da32297ebdf56f503d2449b8afb3bff3ebb1c1b914f547fd12f";

  const crvBribes = [
    {
      gaugeName: "OGV+ETH (0xB5ae…D58c)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 17318.97 - 17318.97,
      decimals: 18,
    },
    {
      gaugeName: "ETH+sETH (0xc542…4567)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 6369.27 + 7690.88 - 14060.15,
      decimals: 18,
    },
    {
      gaugeName: "DAI+USDC+USDT+sUSD (0xA540…fBfD)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 12634.56 + 12572.92 - 17151.32,
      decimals: 18,
    },
    {
      gaugeName: "ETH+rETH (0xF944…e7A8)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 2837.19 + 2823.36,
      decimals: 18,
    },
    {
      gaugeName: "COIL+FRAXBP (0xAF42…DF33)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 51049.07 + 246.58 + 51077.92 + 324.27 - 26746.77,
      decimals: 18,
    },
    {
      gaugeName: "xdai-WXDAI+USDC+USDT (0x7f90…F353)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 1970.30 + 4244.73,
      decimals: 18,
    },
    {
      gaugeName: "ETH+msETH (0xc897…0025)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 871.90 + 917.57,
      decimals: 18,
    },
    {
      gaugeName: "OHM+FRAXBP (0xFc1e…E48D)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 1889.39 + 1887.50,
      decimals: 18,
    },
    {
      gaugeName: "arbitrum-VST+FRAX (0x59bF…6Ba4)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 2200.67 + 2199.16,
      decimals: 18,
    },
    {
      gaugeName: "arbitrum-FRAX+USDC (0xC9B8…40d5)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 2209.93 + 2199.16,
      decimals: 18,
    },
    {
      gaugeName: "USDT+WBTC+WETH (0xD51a…AE46)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 47595.31 + 48748.08 - 96343.38,
      decimals: 18,
    },
    {
      gaugeName: "WETH+CRV (0x8301…C511)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 40524.45 + 42911.06 - 68331.50,
      decimals: 18,
    },
    {
      gaugeName: "polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7)",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 10481.96 + 10810.62 - 21292.57,
      decimals: 18,
    }
  ]

  const balBribes = [
    {
      gaugeName: "50PENDLE-50WETH",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 2340.92 + 2295.74,
      decimals: 18,
    },
    {
      gaugeName: "50INV-50DOLA",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 3400.18 + 3330.77 - 4029.66,
      decimals: 18,
    },
    {
      gaugeName: "50RBN-50USDC",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 1898.30 + 1859.56 - 1404.34,
      decimals: 18,
    },
    {
      gaugeName: "B-stETH-STABLE",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 338.71 + 1043.94 + 688.50 - 2071.15,
      decimals: 18,
    },
    {
      gaugeName: "80D2D-20USDC",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 4438.69 + 4348.52 - 8787.20,
      decimals: 18,
    },
    {
      gaugeName: "B-sdBAL-STABLE",
      token: "SDT",
      symbol: "SDT",
      image: SDT_IMAGE,
      address: SDT_ADDRESS,
      amount: 1978.84 + 1939.54,
      decimals: 18,
    },
    
    
    
    

    // YK
    /*{
      gaugeName: "20WBTC-80BADGER",
      token: "sdBAL",
      symbol: "sdBAL",
      image: "https://cryptologos.cc/logos/balancer-bal-logo.png",
      address: SDBAL,
      amount: 32.962 + 32.962,
      decimals: 18,
    },*/
    // HH Gauges, gauge which have 0 vote
    /*{
      gaugeName: "wstETH-rETH-sfrxETH-BPT",
      token: "sdBAL",
      symbol: "sdBAL",
      image: "https://cryptologos.cc/logos/balancer-bal-logo.png",
      address: SDBAL,
      amount: 0,
      decimals: 18,
    }*/
  ];

  const fraxBribes = [
    {
      gaugeName: "Temple FRAX/TEMPLE",
      token: "sdFXS",
      symbol: "sdFXS",
      image: "https://assets.coingecko.com/coins/images/13423/small/Frax_Shares_icon.png?1679886947",
      address: SDFXS,
      amount: 222.79 + 221.71 - 332.70,
      decimals: 18,
    },
    {
      gaugeName: "Convex stkcvxSDTFRAXBP",
      token: "sdFXS",
      symbol: "sdFXS",
      image: "https://assets.coingecko.com/coins/images/13423/small/Frax_Shares_icon.png?1679886947",
      address: SDFXS,
      amount: 92.34 + 128.88 - 71.96,
      decimals: 18,
    },
    
    
  ];

  const angleBribes = [];

  const bribes = crvBribes.concat(balBribes).concat(fraxBribes).concat(angleBribes);

  // Delegations
  const crvDelegationRewards = 96343.38 + 26746.77 + 17151.32 + 14060.15 + 17318.97 + 21292.57 + 68331.50;
  const balDelegationRewards = 4029.66 + 1404.34 + 8787.20 + 2071.15;
  const fraxDelegationRewards = 71.96 + 332.70;
  const angleDelegationRewards = 0;

  // OTC
  const crvOtcDelegation = [];
  const balOtcDelegation = [];
  const fraxOtcDelegation = [];
  const angleOtcDelegation = [];

  // sdBAL extra rewards
  const extraRewardsPerAddress = {
    //"0xb0e83C2D71A991017e0116d58c5765Abc57384af": 80.457,
  };

  const crvMapBribeRewards = await bribesRun(crvIdProposal, "sdcrv.eth", crvBribes, crvDelegationRewards, crvOtcDelegation);
  const balMapBribeRewards = await bribesRun(balIdProposal, "sdbal.eth", balBribes, balDelegationRewards, balOtcDelegation);
  const fraxMapBribeRewards = await bribesRun(fraxIdProposal, "sdfxs.eth", fraxBribes, fraxDelegationRewards, fraxOtcDelegation);
  //const angleMapBribeRewards = await bribesRun(angleIdProposal, "sdangle.eth", angleBribes, angleDelegationRewards, angleOtcDelegation);

  // Compute all bribes rewards from protocols
  const mapBribeRewards = crvMapBribeRewards;
  for (const key of Object.keys(balMapBribeRewards)) {
    if (!mapBribeRewards[key]) {
      mapBribeRewards[key] = balMapBribeRewards[key];
    } else {
      mapBribeRewards[key] = mapBribeRewards[key].concat(balMapBribeRewards[key]);
    }
  }
  for (const key of Object.keys(fraxMapBribeRewards)) {
    if (!mapBribeRewards[key]) {
      mapBribeRewards[key] = fraxMapBribeRewards[key];
    } else {
      mapBribeRewards[key] = mapBribeRewards[key].concat(fraxMapBribeRewards[key]);
    }
  }
  /*for (const key of Object.keys(angleMapBribeRewards)) {
    if (!mapBribeRewards[key]) {
      mapBribeRewards[key] = angleMapBribeRewards[key];
    } else {
      mapBribeRewards[key] = mapBribeRewards[key].concat(angleMapBribeRewards[key]);
    }
  }*/

  // mapBribeRewards contains the reward amount of each users for each gauges bribed
  // Now, we have to know who claimed their rewards
  /*const claimedData = await getAllAccountClaimedSinceLastFreeze();

  // Organize it by tokens
  const claimedByTokens = {};
  for (const cd of claimedData) {
    if (!claimedByTokens[cd.id]) {
      claimedByTokens[cd.id.toLowerCase()] = [];
    }

    claimedByTokens[cd.id.toLowerCase()] = claimedByTokens[cd.id.toLowerCase()].concat(cd.addresses.map((a) => a.toLowerCase()));
  }*/

  const claimedByTokens = await getAllAccountClaimedSinceLastFreezeWithAgnostic();

  // Now, we get users who didn't claim yet last rewards
  // Map organize by token address
  let usersWhoNeedClaim = {};

  for (const bribe of lastMerkle) {
    usersWhoNeedClaim[bribe.address] = [];

    // If we don't have claim for this token, so all users need to claim yet
    // We create an empty array which allow all users in the next loop to claim
    if (!claimedByTokens[bribe.address.toLowerCase()]) {
      claimedByTokens[bribe.address.toLowerCase()] = [];
    }

    for (const key of Object.keys(bribe.merkle)) {
      //If the user didn't claim, we add him
      if (claimedByTokens[bribe.address.toLowerCase()].indexOf(key.toLowerCase()) === -1) {
        usersWhoNeedClaim[bribe.address].push({
          account: key.toLowerCase(),
          amount: BigNumber.from(bribe.merkle[key].amount),
        });
      }
    }
  }

  // Now, we add them in the new distribution
  for (const gaugeName of Object.keys(mapBribeRewards)) {

    // Increment or add the reward user in the map
    for (const r of mapBribeRewards[gaugeName]) {

      // Get token address
      let tokenAddress = null;

      // SDT or extra reward for delegation users
      if (gaugeName.startsWith(DELEGATION_PREFIX)) {
        // OTC
        const indexOfArrobase = gaugeName.indexOf(DELEGATION_EXTRA_REWARD_PREFIX);
        if (indexOfArrobase > -1) {
          tokenAddress = gaugeName.substring(indexOfArrobase + 1, gaugeName.length);
        }
      } else {
        tokenAddress = bribes.find(b => b.gaugeName === gaugeName).address;
      }

      if (gaugeName.startsWith(DELEGATION_PREFIX) && tokenAddress === null) {
        tokenAddress = r.tokenAddress;
      }

      if (tokenAddress === null) {
        throw new Error("tokenAddress null");
      }

      // Check if we have a previous distribution to do for this token address
      if (!usersWhoNeedClaim[tokenAddress]) {
        usersWhoNeedClaim[tokenAddress] = [];
      }

      let find = false;
      for (const u of usersWhoNeedClaim[tokenAddress]) {
        if (u.account.toLowerCase() === r.voter.toLowerCase() && BigNumber.from(r.amount).gt(0)) {
          find = true;
          u.amount = BigNumber.from(u.amount).add(BigNumber.from(r.amount));
          break;
        }
      }

      if (!find && BigNumber.from(r.amount).gt(0)) {
          usersWhoNeedClaim[tokenAddress].push({
            amount: BigNumber.from(r.amount),
            account: r.voter.toLowerCase(),
          });
      }
    }
  }

  for (const userAddress of Object.keys(extraRewardsPerAddress)) {
    for (const u of usersWhoNeedClaim[SDBAL]) {
      if (u.account === userAddress.toLowerCase()) {
        u.amount = u.amount.add(parseUnits(extraRewardsPerAddress[userAddress].toString(), 18));
        break;
      }
    }
  }

  // We generate the merkle tree
  // IMPORTANT 
  // Increment the index [0, ...] for each tokens
  const global = [];
  const localGlobal = [];
  fs.writeFileSync(`tmp/tot.json`, JSON.stringify(usersWhoNeedClaim));
  for (const tokenAddress of Object.keys(usersWhoNeedClaim)) {
    let bribe = bribes.find(b => b.address === tokenAddress);
    if (!bribe) {
      // Maybe an old bribe in the last merkle
      bribe = lastMerkle.find(b => b.address === tokenAddress);
    }

    if (!bribe) {
      // Maybe an OTC deal
      bribe = crvOtcDelegation.find((o) => o.address === tokenAddress);
    }

    if(!bribe) {
      throw new Error("bribe null");
    }

    const usersEligible = usersWhoNeedClaim[tokenAddress];
    const users = [];

    for (let i = 0; i < usersEligible.length; i++) {
      users.push({
        index: i,
        address: usersEligible[i].account.toLowerCase(),
        amount: usersEligible[i].amount,
      });
    }

    const elements = users.map((x) => {
      let amount = BigNumber.from(x.amount);
      return utils.solidityKeccak256(["uint256", "address", "uint256"], [x.index, x.address.toLowerCase(), amount]);
    });

    const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

    let res = {};
    let localRes = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      let amount = BigNumber.from(user.amount);

      res[user.address.toLowerCase()] = {
        index: user.index,
        amount: amount,
        proof: merkleTree.getHexProof(elements[i]),
      };

      localRes.push({
        address: user.address.toLowerCase(),
        amount: (BigNumber.from(user.amount).div(BigNumber.from(10).pow(15)).toNumber() / 1000).toString(),
      });
    }

    global.push({
      "symbol": bribe.symbol,
      "address": bribe.address,
      "image": bribe.image,
      "merkle": res,
      root: merkleTree.getHexRoot(),
      "total": Object.values(res).reduce((acc, o) => acc.add(o.amount), BigNumber.from(0))
    });

    localGlobal.push({
      "symbol": bribe.symbol,
      "address": bribe.address,
      "merkle": localRes,
      "total": localRes.reduce((acc, o) => acc + parseFloat(o.amount), 0)
    });
  }

  fs.writeFileSync('merkle.json', JSON.stringify(global));
  fs.writeFileSync('tmp/localGlobal.json', JSON.stringify(localGlobal));

}

main();