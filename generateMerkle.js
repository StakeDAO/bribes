const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const firstTab = `50RBN-50USDC	25/07/2023	6,259.98	RBN	0.20	1,251.99	sdBAL	12.66	98.91	BAL
80D2D-20USDC	25/07/2023	3,397.49	USDC	1.00	3,397.49	sdBAL	12.66	268.40	BAL
80Silo-20WETH	25/07/2023	7,621.20	Silo	0.05	360.19	sdBAL	12.66	28.45	BAL
B-baoETH-ETH-BPT	25/07/2023	252.78	BAL	4.50	1,137.52	sdBAL	12.66	89.86	BAL
B-baoUSD-LUSD-BPT	25/07/2023	399.64	BAL	4.50	1,798.37	sdBAL	12.66	142.07	BAL
B-sdBAL-STABLE	25/07/2023	3,401.52	SDT	0.35	1,199.61	sdBAL	12.66	94.77	BAL
Convex stkcvxCOILFRAXBP	25/07/2023	89.33	FXS	5.93	529.74	sdFXS	5.96	88.88	FXS
Saddle L2D4 [Arbitrum]	25/07/2023	21.97	ALCX	13.90	305.41	sdFXS	5.96	51.24	FXS
Temple FRAX/TEMPLE	25/07/2023	3,854.75	DAI	1.00	3,853.01	sdFXS	5.96	646.44	FXS
Vesper Orbit FRAX	25/07/2023	797.08	VSP	0.32	257.99	sdFXS	5.96	43.28	FXS
ALCX+FRAXBP (0x4149…9D31)	25/07/2023	73.92	FXS	5.93	438.34	sdCRV	0.73	596.99	CRV
COIL+FRAXBP (0xAF42…DF33)	25/07/2023	42,632.49	CRV	0.73	31,049.15	sdCRV	0.73	42,286.92	CRV
ETH+LDO (0x9409…72B5)	25/07/2023	7,228.52	LDO	1.95	14,095.61	sdCRV	0.73	19,197.30	CRV
ETH+OETH (0x94B1…13E7)	25/07/2023	1,573,195.02	OGV	0.01	13,852.47	sdCRV	0.73	18,866.16	CRV
ETH+msETH (0xc897…0025)	25/07/2023	5,616.73	MET	1.36	7,638.75	sdCRV	0.73	10,403.48	CRV
OGV+ETH (0xB5ae…D58c)	25/07/2023	177,927.29	OGV	0.01	1,566.71	sdCRV	0.73	2,133.76	CRV
USDC+WBTC+WETH (0x7F86…829B)	25/07/2023	18,200.59	CRV	0.73	13,255.46	sdCRV	0.73	18,053.07	CRV
USDC+crvUSD (0x4DEc…D69E)	25/07/2023	24,682.53	CRV	0.73	17,976.24	sdCRV	0.73	24,482.47	CRV
USDT+WBTC+WETH (0xD51a…AE46)	25/07/2023	34,066.05	CRV	0.73	24,810.24	sdCRV	0.73	33,789.93	CRV
USDT+WBTC+WETH (0xf5f5…e2B4)	25/07/2023	7,202.59	CRV	0.73	5,245.63	sdCRV	0.73	7,144.21	CRV
USDT+crvUSD (0x390f…7BF4)	25/07/2023	29,590.35	CRV	0.73	21,550.59	sdCRV	0.73	29,350.50	CRV
WACME+frxETH (0x7bbE…7fa3)	25/07/2023	5.42	FXS	5.93	32.12	sdCRV	0.73	43.75	CRV
WACME+frxETH (0x7bbE…7fa3)	25/07/2023	41,685.61	WACME	0.02	896.48	sdCRV	0.73	1,220.95	CRV
WETH+CRV (0x8301…C511)	25/07/2023	55,486.39	CRV	0.73	40,410.62	sdCRV	0.73	55,036.63	CRV
arbitrum-USDT+WBTC+WETH (0x960e…5590)	25/07/2023	15,000.73	CRV	0.73	10,924.99	sdCRV	0.73	14,879.13	CRV
dETH+frxETH (0x7C0d…98E4)	25/07/2023	76.80	FXS	5.93	455.42	sdCRV	0.73	620.25	CRV
polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7)	25/07/2023	15,462.04	CRV	0.73	11,260.97	sdCRV	0.73	15,336.71	CRV
xdai-WXDAI+USDC+USDT (0x7f90…F353)	25/07/2023	11.24	GNO	113.39	1,274.50	sdCRV	0.73	1,735.79	CRV`;

  const secondTab = `0x73Eb240a06f0e0747C698A219462059be6AacCc8	USDT+crvUSD (0x390f…7BF4)	100.00	485,388.00	15.41%	sdCRV	4,524.059	3,322	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	arbitrum-USDT+WBTC+WETH (0x960e…5590)	6.10	1,385,166.00	100.00%	sdCRV	14,879.125	10,925	0.0079	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+LDO (0x9409…72B5)	8.10	1,839,319.00	100.00%	sdCRV	19,197.304	14,096	0.0077	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+msETH (0xc897…0025)	4.80	1,089,967.00	100.00%	sdCRV	10,403.480	7,639	0.0070	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+OETH (0x94B1…13E7)	6.50	1,475,997.00	88.67%	sdCRV	16,729.562	12,284	0.0083	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7)	6.30	1,430,581.00	100.00%	sdCRV	15,336.708	11,261	0.0079	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+crvUSD (0x4DEc…D69E)	10.50	2,384,302.00	91.52%	sdCRV	22,406.643	16,452	0.0069	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+WBTC+WETH (0x7F86…829B)	8.20	1,862,027.00	100.00%	sdCRV	18,053.074	13,255	0.0071	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+crvUSD (0x390f…7BF4)	10.90	2,475,133.00	78.60%	sdCRV	23,069.476	16,939	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xD51a…AE46)	15.30	3,474,269.00	100.00%	sdCRV	33,789.932	24,810	0.0071	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xf5f5…e2B4)	3.40	772,059.80	100.00%	sdCRV	7,144.207	5,246	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	WETH+CRV (0x8301…C511)	19.90	4,518,820.00	88.88%	sdCRV	48,915.061	35,916	0.0079	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	dETH+frxETH (0x7C0d…98E4)	45.00	1,696,550.00	100.00%	sdCRV	620.252	455	0.0003	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+OETH (0x94B1…13E7)	5.00	188,505.60	11.33%	sdCRV	2,136.601	1,569	0.0083	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	OGV+ETH (0xB5ae…D58c)	5.00	188,505.60	100.00%	sdCRV	2,133.757	1,567	0.0083	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDC+crvUSD (0x4DEc…D69E)	5.00	188,505.60	7.24%	sdCRV	1,771.494	1,301	0.0069	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDT+crvUSD (0x390f…7BF4)	5.00	188,505.60	5.99%	sdCRV	1,756.966	1,290	0.0068	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	WACME+frxETH (0x7bbE…7fa3)	3.00	113,103.40	100.00%	sdCRV	1,264.693	929	0.0082	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	WETH+CRV (0x8301…C511)	15.00	565,516.80	11.12%	sdCRV	6,121.574	4,495	0.0079	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af 	xdai-WXDAI+USDC+USDT (0x7f90…F353)	3	113,103.40	100.00%	sdCRV	1,735.786	1,275	0.0113	CRV
  0xec70538bEac744eec5eDec4b329205a4b29Ba8AE	ALCX+FRAXBP (0x4149…9D31)	100	38,486.46	13.22%	sdCRV	78.917	58	0.0015	CRV
  0xf872703F1C8f93fA186869Bac83BAC5A0c87C3c8	ALCX+FRAXBP (0x4149…9D31)	6.666667	252,655.00	86.78%	sdCRV	518.073	380	0.0015	CRV
  0xa7888F85BD76deeF3Bd03d4DbCF57765a49883b3	COIL+FRAXBP (0xAF42…DF33)	100	2,399,335.00	48.12%	sdCRV	20,350.219	14,942	0.0062	CRV
  0xC47eC74A753acb09e4679979AfC428cdE0209639	COIL+FRAXBP (0xAF42…DF33)	100	2,586,385.00	51.88%	sdCRV	21,936.703	16,107	0.0062	CRV
  0x989225f2F9bA272aDbce6d579232C4113ee998D8	USDC+crvUSD (0x4DEc…D69E)	100	32,384.12	1.24%	sdCRV	304.332	223	0.0069	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Vesper Orbit FRAX	5	27,124.25	100.00%	sdFXS	43.284	258	0.0095	FXS
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Temple FRAX/TEMPLE	85	461,112.20	84.02%	sdFXS	543.139	3,237	0.0070	FXS
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Saddle L2D4 [Arbitrum]	10	54,248.50	100.00%	sdFXS	51.240	305	0.0056	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Temple FRAX/TEMPLE	50	87,698.47	15.98%	sdFXS	103.299	616	0.0070	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Convex stkcvxCOILFRAXBP	50	87,698.47	100.00%	sdFXS	88.877	530	0.0060	FXS
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	50RBN-50USDC	13.2	5,206.57	42.66%	sdBAL	42.193	534	0.1026	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	80D2D-20USDC	57.6	22,719.58	72.20%	sdBAL	193.784	2,453	0.1080	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoETH-ETH-BPT	13.7	5,403.79	100.00%	sdBAL	89.863	1,138	0.2105	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoUSD-LUSD-BPT	10.7	4,220.48	32.54%	sdBAL	46.235	585	0.1387	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-sdBAL-STABLE	4.8	1,893.30	10.86%	sdBAL	10.291	130	0.0688	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	50RBN-50USDC	20	6,998.40	57.34%	sdBAL	56.713	718	0.1026	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	80D2D-20USDC	25	8,748.01	27.80%	sdBAL	74.615	945	0.1080	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	80Silo-20WETH	10	3,499.20	100.00%	sdBAL	28.455	360	0.1029	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-baoUSD-LUSD-BPT	25	8,748.01	67.46%	sdBAL	95.834	1,213	0.1387	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-sdBAL-STABLE	20	6,998.40	40.14%	sdBAL	38.040	482	0.0688	BAL
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	B-sdBAL-STABLE	100	8,543.30	49.00%	sdBAL	46.437	588	0.0688	BAL`;

const SKIP_MERKLE_TOKENS = ["0x2260fac5e5542a773aa44fbcfedf7c193bc2c599"]

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

const DATE_LAST_UPDATE_QUERY = (timestamp, tokenAddress) => `
SELECT
    timestamp
FROM evm_events_ethereum_mainnet
WHERE
    address = '0x03E34b085C52985F6a5D27243F20C84bDdc01Db4' and
    timestamp < '${timestamp}' and
    input_0_value_address = '${tokenAddress}' and
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

const getAllAccountClaimedSinceLastFreezeWithAgnostic = async (tokenAddress) => {
  const lastClaim = await agnosticFetch(DATE_LAST_CLAIM_QUERY);
  const lastUpdate = await agnosticFetch(DATE_LAST_UPDATE_QUERY(lastClaim[0][0], tokenAddress));

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

    if (columns[8] === "-") {
      columns[8] = "0";
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

    if (columns[6] === "-") {
      columns[6] = "0";
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
  const crvIdProposal = "0x55c1011e6d20c80fba2e601fc698987117fd8dad65e30861c16205ff227992b5";
  const balIdProposal = "0x1870834cbe53922c7ada2c3a5f12f62ba3b035abd1b847598586d2c86a2293df";
  const fraxIdProposal = "0xdf52554dbf06458e05684fd1607d74603f8d4711acb23796cec4dcf298a2d243";
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

  const claimedByTokens = {};
  for (const bribe of lastMerkle) {
    const d = await getAllAccountClaimedSinceLastFreezeWithAgnostic(bribe.address);
    claimedByTokens[bribe.address.toLowerCase()] = d[bribe.address.toLowerCase()] || [];
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

    let find = false;
    for (const t of SKIP_MERKLE_TOKENS) {
      if (t.toLowerCase() === bribe.address.toLowerCase()) {
        find = true;
        break;
      }
    }

    if (find) {
      const oldMerkleToken = lastMerkle.find((m) => m.address.toLowerCase() === bribe.address.toLowerCase());
      global.push(oldMerkleToken);
    } else {
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
  }

  fs.writeFileSync('merkle.json', JSON.stringify(global));
  fs.writeFileSync('tmp/localGlobal.json', JSON.stringify(localGlobal));

}

main();