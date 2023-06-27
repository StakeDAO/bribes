const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const firstTab = `80D2D-20USDC	27/06/2023	1,501.45	USDC	1.00	1,501.45	SDT	0.42	3,587.69	BAL
80Silo-20WETH	27/06/2023	7,548.85	Silo	0.05	348.85	SDT	0.42	833.57	BAL
B-baoUSD-LUSD-BPT	27/06/2023	253.71	BAL	3.55	899.82	SDT	0.42	2,150.11	BAL
B-sdBAL-STABLE	27/06/2023	9,386.89	SDT	0.42	3,979.44	SDT	0.42	9,508.81	BAL
ankrETH/wstETH	27/06/2023	158,405.03	ANKR	0.02	3,862.24	SDT	0.42	9,228.76	BAL
swETH-bb-a-WETH-BPT	27/06/2023	1.46	swETH	1,917.55	2,799.62	SDT	0.42	6,689.65	BAL
ALCX+FRAXBP (0x4149...9D31)	27/06/2023	78.72	FXS	5.90	464.44	SDT	0.42	1,109.77	CRV
COIL+FRAXBP (0xAF42...DF33)	27/06/2023	46.69	FXS	5.90	275.46	SDT	0.42	658.21	CRV
COIL+FRAXBP (0xAF42...DF33)	27/06/2023	9,721.43	SPR	2.96	28,779.04	SDT	0.42	68,767.06	CRV
ETH+LDO (0x9409...72B5)	27/06/2023	8,112.49	LDO	1.98	16,062.74	SDT	0.42	38,381.66	CRV
ETH+OETH (0x94B1...13E7)	27/06/2023	2,209,805.62	OGV	0.01	18,716.57	SDT	0.42	44,722.95	CRV
ETH+msETH (0xc897...0025)	27/06/2023	5,864.99	MET	1.37	8,035.33	SDT	0.42	19,200.29	CRV
OGV+ETH (0xB5ae...D58c)	27/06/2023	635,852.82	OGV	0.01	5,385.51	SDT	0.42	12,868.59	CRV
USDC+WBTC+WETH (0x7F86...829B)	27/06/2023	13,846.62	CRV	0.69	9,493.73	SDT	0.42	22,685.12	CRV
USDT+WBTC+WETH (0xD51a...AE46)	27/06/2023	44,215.49	CRV	0.56	24,767.73	SDT	0.42	59,182.10	CRV
USDT+crvUSD (0x390f...7BF4)	27/06/2023	23,777.72	CRV	0.69	16,302.85	SDT	0.42	38,955.40	CRV
WACME+frxETH (0x7bbE...7fa3)	27/06/2023	11.48	FXS	5.90	67.69	SDT	0.42	161.74	CRV
WACME+frxETH (0x7bbE...7fa3)	27/06/2023	39,090.52	WACME	0.02	914.36	SDT	0.42	2,184.85	CRV
WETH+CRV (0x8301...C511)	27/06/2023	40,091.89	CRV	0.69	27,488.62	SDT	0.42	65,683.62	CRV
arbitrum-USDT+WBTC+WETH (0x960e...5590)	27/06/2023	10,966.12	CRV	0.69	7,518.76	SDT	0.42	17,965.96	CRV
msUSD+FRAXBP (0xc3b1...51dD)	27/06/2023	727.95	MET	1.37	997.64	SDT	0.42	2,383.84	CRV
polygon-CRV+crvUSDBTCETH (0xc7c9...8Fa7)	27/06/2023	14,493.29	CRV	0.69	9,937.13	SDT	0.42	23,744.61	CRV
xdai-WXDAI+USDC+USDT (0x7f90...F353)	27/06/2023	13.59	GNO	115.58	1,570.68	SDT	0.42	3,753.11	CRV
Temple FRAX/TEMPLE	27/06/2023	3,166.14	DAI	1.00	3,169.31	sdFXS	5.78	548.24	FXS
Convex stkcvxSDTFRAXBP	27/06/2023	203.37	sdFXS	5.83	1,186.51	sdFXS	5.78	205.25	FXS
USDT+WBTC+WETH (0xf5f5...e2B4)	27/06/2024	9,904.84	CRV	0.56	5,548.29	SDT	0.42	13,257.55	CRV`;

  const secondTab = `0xC47eC74A753acb09e4679979AfC428cdE0209639	COIL+FRAXBP (0xAF42...DF33)	100.00	1,905,407.00	48.76%	SDT	33,854.199	14,168	0.0074	CRV
  0xa7888F85BD76deeF3Bd03d4DbCF57765a49883b3	COIL+FRAXBP (0xAF42...DF33)	100.00	2,002,037.00	51.24%	SDT	35,571.067	14,887	0.0074	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xD51a...AE46)	24.50	4,409,623.00	100.00%	SDT	59,182.097	24,768	0.0056	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	WETH+CRV (0x8301...C511)	22.25	4,004,657.00	100.00%	SDT	65,683.620	27,489	0.0069	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+msETH (0xc897...0025)	2.50	449,961.50	47.77%	SDT	9,171.285	3,838	0.0085	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+LDO (0x9409...72B5)	13.25	2,384,796.00	100.00%	SDT	38,381.662	16,063	0.0067	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	OGV+ETH (0xB5ae...D58c)	2.50	449,961.50	81.02%	SDT	10,425.599	4,363	0.0097	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+OETH (0x94B1...13E7)	7.00	1,259,892.00	46.36%	SDT	20,732.592	8,677	0.0069	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+crvUSD (0x390f...7BF4)	3.00	539,953.80	22.12%	SDT	8,617.223	3,606	0.0067	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xf5f5...e2B4)	5.75	1,034,911.00	85.48%	SDT	11,333.158	4,743	0.0046	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+WBTC+WETH (0x7F86...829B)	5.00	899,923.00	71.91%	SDT	16,313.845	6,827	0.0076	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	polygon-CRV+crvUSDBTCETH (0xc7c9...8Fa7)	7.75	1,394,881.00	100.00%	SDT	23,744.614	9,937	0.0071	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	arbitrum-USDT+WBTC+WETH (0x960e...5590)	6.50	1,169,900.00	100.00%	SDT	17,965.957	7,519	0.0064	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	msUSD+FRAXBP (0xc3b1...51dD)	3.00	105,437.80	100.00%	SDT	2,383.845	998	0.0095	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+msETH (0xc897...0025)	14.00	492,043.10	52.23%	SDT	10,029.008	4,197	0.0085	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	OGV+ETH (0xB5ae...D58c)	3.00	105,437.80	18.98%	SDT	2,442.992	1,022	0.0097	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	WACME+frxETH (0x7bbE...7fa3)	3.00	105,437.80	100.00%	SDT	2,346.593	982	0.0093	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+OETH (0x94B1...13E7)	30.00	1,054,378.00	38.80%	SDT	17,350.685	7,261	0.0069	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDT+crvUSD (0x390f...7BF4)	3.00	105,437.80	4.32%	SDT	1,682.701	704	0.0067	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDT+WBTC+WETH (0xf5f5...e2B4)	5.00	175,729.70	14.52%	SDT	1,924.390	805	0.0046	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDC+WBTC+WETH (0x7F86...829B)	10.00	351,459.40	28.09%	SDT	6,371.272	2,666	0.0076	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	xdai-WXDAI+USDC+USDT (0x7f90...F353)	6.00	210,875.60	100.00%	SDT	3,753.115	1,571	0.0074	CRV
  0x73Eb240a06f0e0747C698A219462059be6AacCc8	ETH+OETH (0x94B1...13E7)	100.00	403,483.90	14.85%	SDT	6,639.670	2,779	0.0069	CRV
  0xec70538bEac744eec5eDec4b329205a4b29Ba8AE	ALCX+FRAXBP (0x4149...9D31)	100.00	41,637.86	4.37%	SDT	48.507	20	0.0005	CRV
  0xf872703F1C8f93fA186869Bac83BAC5A0c87C3c8	ALCX+FRAXBP (0x4149...9D31)	22.22	910,973.50	95.63%	SDT	1,061.265	444	0.0005	CRV
  0xB325c1AC788f02fF7997cF53C6FF40Dd762897B3 	USDT+crvUSD (0x390f...7BF4)	100	439440.5	18.00%	SDT	7,013.113	2,935	0.0067	CRV
  0x7a16fF8270133F063aAb6C9977183D9e72835428 	USDT+crvUSD (0x390f...7BF4)	100	1356107	55.56%	SDT	21,642.364	9,057	0.0067	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	80D2D-20USDC	10	3977.69	44.36%	SDT	1,591.669	666	0.1675	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-sdBAL-STABLE	16	6364.304	32.61%	SDT	3,101.110	1,298	0.2039	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	swETH-bb-a-WETH-BPT	30	11933.07	54.47%	SDT	3,643.541	1,525	0.1278	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoUSD-LUSD-BPT	9	3579.921	100.00%	SDT	2,150.106	900	0.2514	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ankrETH/wstETH	35	13921.92	58.25%	SDT	5,376.198	2,250	0.1616	BAL
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	B-sdBAL-STABLE	100	8162.11	41.83%	SDT	3,977.120	1,664	0.2039	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	80D2D-20USDC	15	4988.196	55.64%	SDT	1,996.022	835	0.1675	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-sdBAL-STABLE	15	4988.196	25.56%	SDT	2,430.579	1,017	0.2039	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	80Silo-20WETH	10	3325.464	100.00%	SDT	833.572	349	0.1049	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	swETH-bb-a-WETH-BPT	30	9976.393	45.53%	SDT	3,046.106	1,275	0.1278	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ankrETH/wstETH	30	9976.393	41.75%	SDT	3,852.563	1,612	0.1616	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Temple FRAX/TEMPLE	80	248303	60.15%	sdFXS	329.763	1,906	0.0077	FXS
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Convex stkcvxSDTFRAXBP	20	62075.75	45.23%	sdFXS	92.823	537	0.0086	FXS
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	Convex stkcvxSDTFRAXBP	100	75184.01	54.77%	sdFXS	112.425	650	0.0086	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Temple FRAX/TEMPLE	100	164508.5	39.85%	sdFXS	218.479	1,263	0.0077	FXS`;

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

function sliceIntoChunks(arr, chunkSize) {
  const res = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
      const chunk = arr.slice(i, i + chunkSize);
      res.push(chunk);
  }
  return res;
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
  /*
  const votersChunk = sliceIntoChunks(voters, 10);

  let resp = {};
  for (const v of votersChunk) {
    console.log("score toto", voters.length)
    try {
      const { data } = await axios.post(
        "https://score.snapshot.org/api/scores",
        {
          params: {
            network: "1",
            snapshot: parseInt(proposal.snapshot),
            strategies: proposal.strategies,
            space: proposal.space.id,
            addresses: v
          },
        },
      );

      console.log("score tata")
      resp = {...resp, ...data?.result?.scores[0], ...data?.result?.scores[1] };
    }
    catch(e) {
      console.log(e);
      throw e;
    }

    
  }

  return resp;*/
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
    if (delegationScores[score.voter.toLowerCase()] <= 0) {
      delegationScores[score.voter.toLowerCase()] = 0;
    }
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

const extractBribesData = () => {
  
  // Split on tab (columns)
  const firstTabRows = firstTab.split("\n");
  const secondTabRows = secondTab.split("\n");

  const bribes = {};

  const imagesPerToken = {
    "SDT": SDT_IMAGE,
    "sdFXS": "https://assets.coingecko.com/coins/images/13423/small/Frax_Shares_icon.png?1679886947",
    "sdCRV": "https://assets.coingecko.com/coins/images/27756/small/scCRV-2.png?1665654580",
    "sdBAL": "https://assets.coingecko.com/coins/images/11683/small/Balancer.png?1592792958",
    "sdANGLE": "https://assets.coingecko.com/coins/images/19060/small/ANGLE_Token-light.png?1666774221"
  };

  const addressesPerToken = {
    "SDT": SDT_ADDRESS,
    "sdFXS": SDFXS,
    "sdCRV": SD_CRV,
    "sdBAL": SDBAL,
    "sdANGLE": SDANGLE
  };

  for (const row of firstTabRows) {
    const columns = row.split("\t");

    const locker = columns[9];
    if (!bribes[locker]) {
      bribes[locker] = [];
    }

    while (columns[8].indexOf(",") > -1) {
      columns[8] = columns[8].replace(",", "");
    }

    const tokenAddress = addressesPerToken[columns[6]];
    if(!tokenAddress) {
      throw new Error("Token " + columns[6] + " unknow");
    }

    columns[0] = columns[0].replace("...", "…")
    let bribe = bribes[locker].find((b) => b.gaugeName === columns[0]);
    if (bribe) {
      bribe.amount += parseFloat(columns[8]);
    } else {
      bribe = {
        gaugeName: columns[0],
        token: columns[6],
        symbol: columns[6],
        image: imagesPerToken[columns[6]],
        address: tokenAddress,
        amount: parseFloat(columns[8]),
        decimals: 18,
      };
      bribes[locker].push(bribe);
    }
  }

  const tokens = {};
  for (const locker of Object.keys(bribes)) {
    for (const bribe of bribes[locker]) {
      if (!tokens[bribe.token]) {
        tokens[bribe.token] = 0;
      }

      tokens[bribe.token] += bribe.amount;
    }
  }

  const bribesDelegationsAmounts = {};

  for (const row of secondTabRows) {
    const columns = row.split("\t");

    if (DELEGATION_ADDRESS.toLowerCase() !== columns[0].trim().toLowerCase()) {
      continue;
    }

    const locker = columns[9];
    columns[1] = columns[1].replace("...", "…");
    let bribe = bribes[locker].find((b) => b.gaugeName === columns[1]);
    if (!bribe) {
      throw new Error("no bribe for " + locker + " - " + columns[1]);
    }

    while (columns[6].indexOf(",") > -1) {
      columns[6] = columns[6].replace(",", "");
    }

    const amount = parseFloat(columns[6]);

    bribe.amount -= amount;
    if (bribe.amount < 0) {
      bribe.amount = 0;
    }

    if (!bribesDelegationsAmounts[locker]) {
      bribesDelegationsAmounts[locker] = amount;
    } else {
      bribesDelegationsAmounts[locker] += amount;
    }
  }

  fs.writeFileSync(`tmp/bribes.json`, JSON.stringify(bribes));
  fs.writeFileSync(`tmp/bribesNbTokensToDistribute.json`, JSON.stringify(tokens));
  fs.writeFileSync(`tmp/bribesDelegationsAmounts.json`, JSON.stringify(bribesDelegationsAmounts));

  return {
    bribes,
    bribesDelegationsAmounts
  };
};

const main = async () => {

  /*********** Inputs ********/
  const crvIdProposal = "0x84f3a96fb35e7febed9c6021e80c09ebb4553838c9d7e48c772d019ef0195cd7";
  const balIdProposal = "0x728d884d6a0c50ff6cffd3ac51a093930b731311e4be930d825d063246dfcae9";
  const fraxIdProposal = "0xe195ad0ba97810d9506c1f68c7ce8ab14cd80210ba6b9e751454077203eaeb82";
  //const angleIdProposal = "0x5cc81e3b7a4039a498819389d63ccf4c3dd06cfd2da7ab7170a15e05ae858da9";

  const bribesData = extractBribesData();

  const crvBribes = bribesData.bribes["CRV"] || [];
  const balBribes = bribesData.bribes["BAL"] || [];
  const fraxBribes = bribesData.bribes["FXS"] || [];
  const angleBribes = bribesData.bribes["ANGLE"] || [];

  const bribes = crvBribes.concat(balBribes).concat(fraxBribes).concat(angleBribes);

  // Delegations
  const crvDelegationRewards = bribesData.bribesDelegationsAmounts["CRV"] || 0;
  const balDelegationRewards = bribesData.bribesDelegationsAmounts["BAL"] || 0;
  const fraxDelegationRewards = bribesData.bribesDelegationsAmounts["FXS"] || 0;
  const angleDelegationRewards = bribesData.bribesDelegationsAmounts["ANGLE"] || 0;

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