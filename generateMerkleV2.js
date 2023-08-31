const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { utils, BigNumber } = require("ethers");
const { formatUnits, parseEther } = require("viem");

const SKIP_MERKLE_TOKENS = ["0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"]

const SDT_ADDRESS = "0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F";
const MERKLE_ADDRESS = "0x03E34b085C52985F6a5D27243F20C84bDdc01Db4";

const SNAPSHOT_ENDPOINT = "https://hub.snapshot.org/graphql";
const ENDPOINT_DELEGATORS = "https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot";
const DELEGATION_ADDRESS = "0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC";

const AGNOSTIC_ENDPOINT = "https://proxy.eu-02.agnostic.engineering/query";
const AGNOSTIC_API_KEY = "Fr2LXSVvKCfmXse8JQJiJBLHY9ujU3YZf8Kr6TDDh4Sw";

const SDCRV_SPACE = "sdcrv.eth";
const SDBAL_SPACE = "sdbal.eth";
const SDFXS_SPACE = "sdfxs.eth";
const SDANGLE_SPACE = "sdangle.eth";

const SPACES = [SDCRV_SPACE, SDBAL_SPACE, SDFXS_SPACE, SDANGLE_SPACE];
const SPACES_TOKENS = {
  [SDCRV_SPACE]: "0xD1b5651E55D4CeeD36251c61c50C889B36F6abB5",
  [SDBAL_SPACE]: "0xF24d8651578a55b0C119B9910759a351A3458895",
  [SDFXS_SPACE]: "0x402F878BDd1f5C66FdAF0fabaBcF74741B68ac36",
  [SDANGLE_SPACE]: "0x752B4c6e92d96467fE9b9a2522EF07228E00F87c"
};

const SPACES_SYMBOL = {
  [SDCRV_SPACE]: "sdCRV",
  [SDBAL_SPACE]: "sdBAL",
  [SDFXS_SPACE]: "sdFXS",
  [SDANGLE_SPACE]: "sdANGLE"
};

const SPACES_IMAGE = {
  [SDCRV_SPACE]: "https://assets.coingecko.com/coins/images/27756/small/scCRV-2.png?1665654580",
  [SDBAL_SPACE]: "https://assets.coingecko.com/coins/images/11683/small/Balancer.png?1592792958",
  [SDFXS_SPACE]: "https://assets.coingecko.com/coins/images/13423/small/Frax_Shares_icon.png?1679886947",
  [SDANGLE_SPACE]: "https://assets.coingecko.com/coins/images/19060/small/ANGLE_Token-light.png?1666774221"
};

const main = async () => {

  const csvResult = extractCSV();

  // Fetch last merkle
  const { data: lastMerkles } = await axios.get("https://raw.githubusercontent.com/StakeDAO/bribes/main/merkle.json");

  // Fetch last proposal ids
  const proposalIdPerSpace = await fetchLastProposalsIds();

  const newMerkles = [];

  for (const space of Object.keys(proposalIdPerSpace)) {
    if (!SPACES_SYMBOL[space]) {
      throw new Error("No symbol defined for space " + space);
    }
    if (!SPACES_IMAGE[space]) {
      throw new Error("No image defined for space " + space);
    }

    const id = proposalIdPerSpace[space];

    // Get the proposal to find the create timestamp
    const proposal = await getProposal(id);

    // Here, we should have delegation voter + all other voters
    // Object with vp property
    let voters = await getVoters(id);
    voters = await getVoterVotingPower(proposal, voters);

    // Get all delegator addresses
    const delegators = await getAllDelegators(proposal.created, space);

    // Get voting power for all delegator
    // Map of address => VotingPower
    const delegatorsVotingPower = await getDelegationVotingPower(proposal, delegators.concat([DELEGATION_ADDRESS]));

    // Reduce delegator voting power if some guys voted directly
    for (const delegatorAddress of Object.keys(delegatorsVotingPower)) {
      const da = delegatorAddress.toLowerCase();
      for (const vote of voters) {
        if (vote.voter.toLowerCase() === da) {
          delegatorsVotingPower[delegatorAddress] -= vote.vp;
          if (delegatorsVotingPower[delegatorAddress] <= 0) {
            delegatorsVotingPower[delegatorAddress] = 0;
          }
          break;
        }
      }
    }

    const delegatorSumVotingPower = Object.values(delegatorsVotingPower).reduce((acc, vp) => acc + vp, 0.0);
    let delegationVote = voters.find((v) => v.voter.toLowerCase() === DELEGATION_ADDRESS.toLowerCase());
    if (!delegationVote) {
      throw new Error("No delegation vote for " + space + " - " + id);
    }
    /*if(delegationVote.vp !== delegatorSumVotingPower) {
      throw new Error("Voting power delegation !== voting power sum all delegators - " + delegationVote.vp + " vs " + delegatorSumVotingPower + " - " + space + " - " + id);
    }*/

    // We can have sum delegation lower than delegation vp
    delegationVote.vp = delegatorSumVotingPower;
    delegationVote.totalRewards = 0;

    // Extract address per choice
    // The address will be only the strat of the address
    let addressesPerChoice = extractProposalChoices(proposal);

    // Get only choices where we have a bribe reward
    // Now, the address is the complete address
    // Map -> gauge address => {index : choice index, amount: sdTKN }
    addressesPerChoice = getChoiceWhereExistsBribe(addressesPerChoice, csvResult[space]);

    for (const gaugeAddress of Object.keys(addressesPerChoice)) {
      const index = addressesPerChoice[gaugeAddress].index;
      const sdTknRewardAmount = addressesPerChoice[gaugeAddress].amount;

      // Calculate the total VP used to vote for this gauge across all voters
      let totalVP = 0;
      for (const voter of voters) {
        let vpChoiceSum = 0;
        let currentChoiceIndex = 0;
        for (const choiceIndex of Object.keys(voter.choice)) {
          if (index === parseInt(choiceIndex)) {
            currentChoiceIndex = voter.choice[choiceIndex];
          }

          vpChoiceSum += voter.choice[choiceIndex];
        }

        if (currentChoiceIndex === 0) {
          continue;
        }

        const ratio = currentChoiceIndex * 100 / vpChoiceSum;
        totalVP += voter.vp * ratio / 100;
      }

      // We split the bribe reward amount amount between voters
      for (const voter of voters) {
        // Sum choice votes
        let vpChoiceSum = 0;
        let currentChoiceIndex = 0;
        for (const choiceIndex of Object.keys(voter.choice)) {
          if (index === parseInt(choiceIndex)) {
            currentChoiceIndex = voter.choice[choiceIndex];
          }

          vpChoiceSum += voter.choice[choiceIndex];
        }

        if (currentChoiceIndex === 0) {
          // User not voted for this gauge
          continue;
        }

        // User voted for this gauge address
        // We calculate his vp associated
        const ratio = currentChoiceIndex * 100 / vpChoiceSum;
        const vpUsed = voter.vp * ratio / 100;
        const totalVPRatio = vpUsed * 100 / totalVP;
        const amountEarned = totalVPRatio * sdTknRewardAmount / 100;

        if (voter.totalRewards === undefined) {
          voter.totalRewards = 0;
        }

        voter.totalRewards += amountEarned;
      }
    }

    // Now we have all rewards across all voters
    // But one voter is the delegation, we have to split his rewards across the delegation
    delegationVote = voters.find((v) => v.voter.toLowerCase() === DELEGATION_ADDRESS.toLowerCase());
    delegationVote.delegation = {};

    for (const delegatorAddress of Object.keys(delegatorsVotingPower)) {
      const vp = delegatorsVotingPower[delegatorAddress];
      const ratioVp = vp * 100 / delegationVote.vp;

      // This user should receive ratioVp% of all rewards
      delegationVote.delegation[delegatorAddress] = ratioVp * delegationVote.totalRewards / 100;
    }

    // Check split
    const totalSplitDelegationRewards = Object.values(delegationVote.delegation).reduce((acc, d) => acc + d, 0.0) || 0;
    if (parseInt(delegationVote.totalRewards) !== parseInt(totalSplitDelegationRewards)) {
      throw new Error("Delegation split rewards wrong " + delegationVote.totalRewards + " - " + totalSplitDelegationRewards);
    }

    // Create a map with userAddress => reward amount
    const userRewards = {};
    for (const voter of voters) {
      if (!voter.totalRewards) {
        continue
      }

      if (voter.delegation) {
        for (const delegatorAddress of Object.keys(voter.delegation)) {
          const amount = voter.delegation[delegatorAddress.toLowerCase()];
          if (userRewards[delegatorAddress.toLowerCase()]) {
            userRewards[delegatorAddress.toLowerCase()] += amount;
          } else {
            userRewards[delegatorAddress.toLowerCase()] = amount;
          }
        }
      } else {
        if (userRewards[voter.voter.toLowerCase()]) {
          userRewards[voter.voter.toLowerCase()] += voter.totalRewards;
        } else {
          userRewards[voter.voter.toLowerCase()] = voter.totalRewards;
        }
      }
    }

    // New distribution is split here
    // We have to sum with old distribution if users don't claim
    const tokenToDistribute = SPACES_TOKENS[space];

    const lastMerkle = lastMerkles.find((m) => m.address.toLowerCase() === tokenToDistribute.toLowerCase());
    if (lastMerkle) {

      const usersClaimedAddress = await getAllAccountClaimedSinceLastFreezeWithAgnostic(tokenToDistribute);

      const userAddressesLastMerkle = Object.keys(lastMerkle.merkle);

      for (const userAddress of userAddressesLastMerkle) {

        const userAddressLowerCase = userAddress.toLowerCase();
        const isClaimed = usersClaimedAddress[userAddressLowerCase];

        // If user didn't claim, we add the previous rewards to new one
        if (!isClaimed) {
          const leaf = lastMerkle.merkle[userAddress];
          const amount = parseFloat(formatUnits(BigNumber.from(leaf.amount), 18));

          if (userRewards[userAddressLowerCase]) {
            userRewards[userAddressLowerCase] += amount;
          } else {
            userRewards[userAddressLowerCase] = amount;
          }
        }
      }
    }

    // Since this point, userRewards map contains the new reward amount for each user
    // We have to generate the merkle
    const userRewardAddresses = Object.keys(userRewards);
    const elements = [];
    for (let i = 0; i < userRewardAddresses.length; i++) {
      const userAddress = userRewardAddresses[i];
      const amount = parseEther(userRewards[userAddress].toString());
      elements.push(utils.solidityKeccak256(["uint256", "address", "uint256"], [i, userAddress.toLowerCase(), BigNumber.from(amount)]));
    }

    const merkleTree = new MerkleTree(elements, keccak256, { sort: true });

    const merkle = {};
    for (let i = 0; i < userRewardAddresses.length; i++) {
      const userAddress = userRewardAddresses[i];
      const amount = userRewards[userAddress];

      merkle[userAddress.toLowerCase()] = {
        index: i,
        amount: amount,
        proof: merkleTree.getHexProof(elements[i]),
      };
    }

    newMerkles.push({
      "symbol": SPACES_SYMBOL[space],
      "address": tokenToDistribute,
      "image": SPACES_IMAGE[space],
      "merkle": merkle,
      root: merkleTree.getHexRoot(),
    });
  }

  for (const lastMerkle of lastMerkles) {

    let found = false;
    for (const newMerkle of newMerkles) {
      if (newMerkle.address.toLowerCase() === lastMerkle.address.toLowerCase()) {
        found = true;
        break;
      }
    }

    if (!found) {
      newMerkles.push(lastMerkle);
    }
  }

  fs.writeFileSync(`./merkleV2.json`, JSON.stringify(newMerkles));

}

const extractCSV = () => {
  // TODO
  return {
    [SDCRV_SPACE]: {
      "0x8d867bef70c6733ff25cc0d1caa8aa6c38b24817": 10000
    }
  }
};

/**
 * Fetch last proposal id for all spaces
 */
const fetchLastProposalsIds = async () => {

  const query = gql`
    query Proposals {
      proposals(
        first: 1000
        skip: 0
        orderBy: "created",
        orderDirection: desc,
        where: {
          space_in: [${SPACES.map((space) => '"' + space + '"').join(",")}]
          type: "weighted"
        }
      ) {
        id
        title
        space {
          id
        }
      }
    }
  `;

  const result = await request(SNAPSHOT_ENDPOINT, query);
  const proposals = result.proposals.filter((proposal) => proposal.title.indexOf("Gauge vote") > -1);

  const proposalIdPerSpace = {};
  for (const space of SPACES) {

    let firstFound = false;
    for (const proposal of proposals) {
      if (proposal.space.id !== space) {
        continue;
      }

      if (firstFound) {
        proposalIdPerSpace[space] = proposal.id;
        break;
      }

      firstFound = true;
    }
  }

  return proposalIdPerSpace;
}

/**
 * Get all voters for a proposal
 */
const getVoters = async (proposalId) => {
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

  let votes = [];
  let run = true;
  let created = null

  // Fetch all data
  do {
    let params = {
      proposal: proposalId,
      orderBy: "created",
      orderDirection: "desc",
    };

    if (created) {
      params["created"] = created;
    }

    const result = await request(SNAPSHOT_ENDPOINT, QUERY_VOTES, params);

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

const getVoterVotingPower = async (proposal, votes) => {

  const votersAddresses = votes.map((v) => v.voter);

  const { data } = await axios.post(
    "https://score.snapshot.org/api/scores",
    {
      params: {
        network: "1",
        snapshot: parseInt(proposal.snapshot),
        strategies: proposal.strategies,
        space: proposal.space.id,
        addresses: votersAddresses
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

/**
 * Fetch the proposal
 */
const getProposal = async (idProposal) => {

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

  const result = await request(SNAPSHOT_ENDPOINT, QUERY_PROPOSAL, {
    id: idProposal,
  });
  return result.proposal;
}

const getAllDelegators = async (proposalCreatedTimestamp, space) => {
  let delegatorAddresses = [];
  let run = true;
  let skip = 0;

  const DELEGATIONS_QUERY = gql`
    query Proposal(
      $skip: Int
      $timestamp: Int
      $space: String
      ) {
      delegations(first: 1000 skip: $skip where: { 
        space: $space 
        delegate:"${DELEGATION_ADDRESS}"
        timestamp_lte: $timestamp
      }) {
        delegator
        space
        delegate
      }
    }
  `;

  // Fetch all data
  do {
    const result = await request(ENDPOINT_DELEGATORS, DELEGATIONS_QUERY, { space, skip, timestamp: proposalCreatedTimestamp });

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

const getDelegationVotingPower = async (proposal, delegatorAddresses) => {
  const { data } = await axios.post(
    "https://score.snapshot.org/api/scores",
    {
      params: {
        network: "1",
        snapshot: parseInt(proposal.snapshot),
        strategies: proposal.strategies,
        space: proposal.space.id,
        addresses: delegatorAddresses
      },
    },
  );

  return { ...data?.result?.scores[0], ...data?.result?.scores[1] };
}

/**
 * For each proposal choice, extract his gauge address with his index
 */
const extractProposalChoices = (proposal) => {
  const SEP = " - 0x";

  const addressesPerChoice = {};
  for (let i = 0; i < proposal.choices.length; i++) {
    const choice = proposal.choices[i];
    const start = choice.indexOf(" - 0x");
    if (start === -1) {
      throw new Error("Impossible to parse choice : " + choice);
    }

    const end = choice.indexOf("…", start);
    if (end === -1) {
      throw new Error("Impossible to parse choice : " + choice);
    }

    const address = choice.substring(start + SEP.length - 2, end);
    addressesPerChoice[address] = i + 1;
  }

  return addressesPerChoice;
};

const getChoiceWhereExistsBribe = (addressesPerChoice, cvsResult) => {
  const newAddressesPerChoice = {};
  if (!cvsResult) {
    return newAddressesPerChoice;
  }

  const addresses = Object.keys(cvsResult).map((addr) => addr.toLowerCase());

  for (const key of Object.keys(addressesPerChoice)) {
    const k = key.toLowerCase();

    for (const addr of addresses) {
      if (addr.indexOf(k) === -1) {
        continue;
      }

      newAddressesPerChoice[addr] = {
        index: addressesPerChoice[key],
        amount: cvsResult[addr]
      };
      break;
    }
  }

  if (Object.keys(newAddressesPerChoice).length !== addresses.length) {
    throw new Error("Error when get complete gauge address");
  }

  return newAddressesPerChoice;
};

const DATE_LAST_CLAIM_QUERY = `
  SELECT
      timestamp
  FROM evm_events_ethereum_mainnet
  WHERE
      address = '${MERKLE_ADDRESS}' and
      signature = 'Claimed(address,uint256,uint256,address,uint256)'
  ORDER BY timestamp DESC
  LIMIT 1
`;

const DATE_LAST_UPDATE_QUERY = (timestamp, tokenAddress) => `
  SELECT
      timestamp
  FROM evm_events_ethereum_mainnet
  WHERE
      address = '${MERKLE_ADDRESS}' and
      timestamp < '${timestamp}' and
      input_0_value_address = '${tokenAddress}' and
      signature = 'MerkleRootUpdated(address,bytes32,uint256)'
  ORDER BY timestamp DESC
  LIMIT 1
`;

const ALL_CLAIMED_QUERY = (since, end, tokenAddress) => `
  SELECT
      input_3_value_address as user
  FROM evm_events_ethereum_mainnet
  WHERE
      address = '${MERKLE_ADDRESS}' and
      timestamp > '${since}' and
      timestamp <= '${end}' and
      input_0_value_address = '${tokenAddress}' and
      signature = 'Claimed(address,uint256,uint256,address,uint256)'
  ORDER BY timestamp DESC
`;

const getAllAccountClaimedSinceLastFreezeWithAgnostic = async (tokenAddress) => {
  const resp = {};

  const lastClaim = await agnosticFetch(DATE_LAST_CLAIM_QUERY);
  const lastUpdate = await agnosticFetch(DATE_LAST_UPDATE_QUERY(lastClaim[0][0], tokenAddress));

  const lastClaimTimestamp = lastClaim[0][0];
  const lastUpdateTimestamp = lastUpdate[0][0];

  const allClaimed = await agnosticFetch(ALL_CLAIMED_QUERY(lastUpdateTimestamp, lastClaimTimestamp, tokenAddress));
  if (!allClaimed) {
    return resp;
  }

  for (const row of allClaimed) {
    resp[row[0].toLowerCase()] = true;
  }
  return resp
}

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

main();