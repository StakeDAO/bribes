const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

// LAST MERKLE
const lastMerkle = require("./lastMerkle.json");

const SDT_ADDRESS = "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F";

const DELEGATION_PREFIX = "delegation-";
const DELEGATION_EXTRA_REWARD_PREFIX = "@";
const ENDPOINT = "https://hub.snapshot.org/graphql";
const ENDPOINT_DELEGATORS = "https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot";
const ENDPOINT_CLAIM_BRIBES = "https://api.thegraph.com/subgraphs/name/pierremarsotlyon1/bribesclaimv2";
const DELEGATION_ADDRESS = "0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC";

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

        // We remove alchemix for f-aleth
        if (mapNameBribes[parseInt(key)] === "f-aleth" && score.voter.toLowerCase() === "0xf872703f1c8f93fa186869bac83bac5a0c87c3c8") {
          continue;
        }

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
  const crvIdProposal = "0x8b67bef20e41f1b8b2c54ec0bdfcdad97d454856f2df2efc1c9484552bd84139";
  const balIdProposal = "0x5e8d4117468b2b7fe4ad0f88a40a50e6b2d0777fa067914b98bda2ddc5ed65fa";
  const fraxIdProposal = "0xe8c1d7fe4a38004f118d43ade3079516dcf174551db9e263062dcdbbd9570afd";
  const angleIdProposal = "0x5548690c9b775ce519de738193318e635247d3225c524c41459efccbeeb113ad";

  const crvBribes = [
    {
      gaugeName: "tricrypto2",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 21328 + 53212.42 + 59727.03 + 13116.76 - 142683.73122,
      decimals: 18,
    },
    {
      gaugeName: "mim",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 373.51 + 6745.14 + 43.78 + 8547.88,
      decimals: 18,
    },
    {
      gaugeName: "crveth",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 2744.00 + 6961.08 + 421.74 + 4745.86,
      decimals: 18,
    },
    {
      gaugeName: "f-paleth",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 3109.98 + 3438.75 - 6548.73790,
      decimals: 18,
    },
    {
      gaugeName: "lusd",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 9294.67 + 9226.91 - 6412.47318,
      decimals: 18,
    }
  ]

  const balBribes = [
    {
      gaugeName: "rETH WETH",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 7419.08,
      decimals: 18,
    },
    {
      gaugeName: "wstETH-50% COMP-50%",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 37607.20 - 37607.20,
      decimals: 18,
    }
  ];

  const fraxBribes = [
    {
      gaugeName: "Vesper Orbit FRAX",
      token: "SDT",
      symbol: "SDT",
      image: "https://assets.coingecko.com/coins/images/13724/small/stakedao_logo.jpg?1611195011",
      address: SDT_ADDRESS,
      amount: 344.41 + 754.79 - 676.19524,
      decimals: 18,
    }
  ];

  const angleBribes = [];

  const bribes = crvBribes.concat(balBribes).concat(fraxBribes).concat(angleBribes);

  // Delegations
  const crvDelegationRewards = 6548.73790 + 6412.47318 + 142683.73122;
  const balDelegationRewards = 37607.20;
  const fraxDelegationRewards = 676.19524;
  const angleDelegationRewards = 0;

  // OTC
  const crvOtcDelegation = [];
  const balOtcDelegation = [];
  const fraxOtcDelegation = [];
  const angleOtcDelegation = [];

  // SDT extra rewards
  const extraRewardsPerAddress = {};

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
  const claimedData = await getAllAccountClaimedSinceLastFreeze();

  // Organize it by tokens
  const claimedByTokens = {};
  for (const cd of claimedData) {
    if (!claimedByTokens[cd.id]) {
      claimedByTokens[cd.id.toLowerCase()] = [];
    }

    claimedByTokens[cd.id.toLowerCase()] = claimedByTokens[cd.id.toLowerCase()].concat(cd.addresses.map((a) => a.toLowerCase()));
  }

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
    // Get token address
    let tokenAddress = null;

    // SDT or extra reward for delegation users
    if (gaugeName.startsWith(DELEGATION_PREFIX)) {
      const indexOfArrobase = gaugeName.indexOf(DELEGATION_EXTRA_REWARD_PREFIX);
      if (indexOfArrobase > -1) {
        tokenAddress = gaugeName.substring(indexOfArrobase + 1, gaugeName.length);
      } else {
        tokenAddress = SDT_ADDRESS;
      }
    } else {
      tokenAddress = bribes.find(b => b.gaugeName === gaugeName).address;
    }

    // Check if we have a previous distribution to do for this token address
    if (!usersWhoNeedClaim[tokenAddress]) {
      usersWhoNeedClaim[tokenAddress] = [];
    }

    // Increment or add the reward user in the map
    for (const r of mapBribeRewards[gaugeName]) {
      let find = false;
      for (const u of usersWhoNeedClaim[tokenAddress]) {
        if (u.account.toLowerCase() === r.voter.toLowerCase()) {
          find = true;
          u.amount = BigNumber.from(u.amount).add(BigNumber.from(r.amount));
          break;
        }
      }

      if (!find) {
        if(r.voter.toLowerCase() === "0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063".toLowerCase()) {
          usersWhoNeedClaim[tokenAddress].push({
            amount: BigNumber.from(577).mul(BigNumber.from(10).pow(18)),
            account: r.voter.toLowerCase(),
          });
        } else {
          usersWhoNeedClaim[tokenAddress].push({
            amount: BigNumber.from(r.amount),
            account: r.voter.toLowerCase(),
          });
        }
      }
    }
  }

  for (const userAddress of Object.keys(extraRewardsPerAddress)) {
    for (const u of usersWhoNeedClaim[SDT_ADDRESS]) {
      if (u.account === userAddress.toLowerCase()) {
        u.amount = u.amount.add(BigNumber.from(extraRewardsPerAddress[userAddress]).mul(BigNumber.from(10).pow(18)));
        break;
      }
    }
  }

  // We generate the merkle tree
  // IMPORTANT 
  // Increment the index [0, ...] for each tokens
  const global = [];
  const localGlobal = [];
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