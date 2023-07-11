const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const firstTab = `ALCX+FRAXBP (0x4149...9D31)	11/7/2023	71.04	FXS	6.34	450.04	SDT	0.44	1,013.35	CRV
COIL+FRAXBP (0xAF42...DF33)	11/7/2023	60,763.32	CRV	0.81	48,998.17	SDT	0.44	110,328.22	CRV
COIL+FRAXBP (0xAF42...DF33)	11/7/2023	63.53	FXS	6.34	402.76	SDT	0.44	906.89	CRV
ETH+LDO (0x9409...72B5)	11/7/2023	8,206.57	LDO	1.95	16,002.82	SDT	0.44	36,033.24	CRV
ETH+OETH (0x94B1...13E7)	11/7/2023	1,994,175.01	OGV	0.01	17,092.64	SDT	0.44	38,487.16	CRV
ETH+msETH (0xc897...0025)	11/7/2023	5,671.39	MET	1.25	7,089.24	SDT	0.44	15,962.70	CRV
MAI+FRAXBP (0x66E3…0Ef9)	11/7/2023	11,514.44	QI	-	-	SDT	0.44	-	CRV
OGV+ETH (0xB5ae...D58c)	11/7/2023	111,709.26	OGV	0.01	957.49	SDT	0.44	2,155.96	CRV
USDC+WBTC+WETH (0x7F86...829B)	11/7/2023	20,211.33	CRV	0.81	16,294.51	SDT	0.44	36,690.03	CRV
USDC+crvUSD (0x4DEc…D69E)	11/7/2023	37,962.95	CRV	0.81	30,606.00	SDT	0.44	68,914.93	CRV
USDT+WBTC+WETH (0xD51a...AE46)	11/7/2023	18,817.63	CRV	0.58	10,884.65	SDT	0.44	24,508.75	CRV
USDT+crvUSD (0x390f...7BF4)	11/7/2023	11,365.62	CRV	0.81	9,163.04	SDT	0.44	20,632.24	CRV
WACME+frxETH (0x7bbE…7fa3)	11/7/2023	38,915.02	WACME	0.02	896.48	SDT	0.44	2,018.59	CRV
WETH+CRV (0x8301...C511)	11/7/2023	23,590.73	CRV	0.81	19,019.01	SDT	0.44	42,824.73	CRV
arbitrum-USDT+WBTC+WETH (0x960e...5590)	11/7/2023	6,944.28	CRV	0.81	5,598.52	SDT	0.44	12,606.08	CRV
fantom-axlUSDC+USDC (0x2610…2CAe)	11/7/2023	3,337.48	AXL	0.36	1,192.16	SDT	0.44	2,684.36	CRV
msUSD+FRAXBP (0xc3b1...51dD)	11/7/2023	578.84	MET	1.25	723.55	SDT	0.44	1,629.20	CRV
polygon-CRV+crvUSDBTCETH (0xc7c9...8Fa7)	11/7/2023	9,032.70	CRV	0.81	7,283.76	SDT	0.44	16,400.70	CRV
xdai-WXDAI+USDC+USDT (0x7f90...F353)	11/7/2023	9.03	GNO	115.26	1,040.82	SDT	0.44	2,343.59	CRV
50RBN-50USDC - 0x81C452E84B10355...65	11/7/2023	13,838.91	RBN	0.18	2,553.28	sdBAL	14.32	178.29	BAL
80D2D-20USDC - 0x1249c510e066731...9e	11/7/2023	3,416.45	USDC	1.00	3,416.37	sdBAL	14.32	238.56	BAL
B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86...11	11/7/2023	280.29	BAL	4.61	1,292.13	sdBAL	14.32	90.23	BAL
B-sdBAL-STABLE - 0xDc2Df969EE5E662...f2	11/7/2023	4,631.93	SDT	0.43	1,999.44	sdBAL	14.32	139.62	BAL
ankrETH/wstETH - 0xbf65b3fA6c20876...48	11/7/2023	291,558.29	ANKR	0.02	7,029.45	sdBAL	14.32	490.86	BAL
Convex stkcvxCOILFRAXBP	11/7/2023	510.61	FXS	6.34	3,234.72	sdFXS	6.33	510.83	FXS
USDT+WBTC+WETH (0xf5f5…e2B4)	11/7/2023	5,307.35	CRV	0.81	4,286.25	SDT	0.44	9,651.27	CRV`;

  const secondTab = `0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	arbitrum-USDT+WBTC+WETH (0x960e...5590)	3.70	727,532.90	100.00%	SDT	12,606.078	5,599	0.0077	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	COIL+FRAXBP (0xAF42...DF33)	8.00	1,573,044.00	38.54%	SDT	42,873.687	19,041	0.0121	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+LDO (0x9409...72B5)	12.00	2,359,566.00	100.00%	SDT	36,033.237	16,003	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+msETH (0xc897...0025)	4.70	924,163.40	89.14%	SDT	14,229.516	6,320	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+OETH (0x94B1...13E7)	8.80	1,730,348.00	69.75%	SDT	26,844.831	11,922	0.0069	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	polygon-CRV+crvUSDBTCETH (0xc7c9...8Fa7)	4.80	943,826.40	100.00%	SDT	16,400.700	7,284	0.0077	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+crvUSD (0x4DEc...D69E)	10.90	2,143,272.00	47.62%	SDT	32,819.696	14,576	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+WBTC+WETH (0x7F86...829B)	11.00	2,162,936.00	100.00%	SDT	36,690.030	16,295	0.0075	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+crvUSD (0x390f...7BF4)	5.00	983,152.50	65.51%	SDT	13,515.363	6,002	0.0061	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xD51a...AE46)	9.90	1,946,642.00	100.00%	SDT	24,508.754	10,885	0.0056	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xf5f5...e2B4)	2.80	550,565.40	100.00%	SDT	9,651.265	4,286	0.0078	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	WETH+CRV (0x8301...C511)	12.20	2,398,892.00	100.00%	SDT	42,824.733	19,019	0.0079	CRV
  0xa7888F85BD76deeF3Bd03d4DbCF57765a49883b3	COIL+FRAXBP (0xAF42...DF33)	100.00	2,508,194.00	61.46%	SDT	68,361.422	30,360	0.0121	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+msETH (0xc897...0025)	3.00	112,565.20	10.86%	SDT	1,733.187	770	0.0068	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+OETH (0x94B1...13E7)	20.00	750,434.50	30.25%	SDT	11,642.333	5,171	0.0069	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	fantom-axlUSDC+USDC (0x2610...2CAe)	4.00	150,086.90	100.00%	SDT	2,684.363	1,192	0.0079	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	MAI+FRAXBP (0x66E3...0Ef9)	2.00	75,043.45	100.00%	SDT	-	-	0.0000	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	msUSD+FRAXBP (0xc3b1...51dD)	3.00	112,565.20	100.00%	SDT	1,629.203	724	0.0064	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	OGV+ETH (0xB5ae...D58c)	3.00	112,565.20	100.00%	SDT	2,155.962	957	0.0085	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	WACME+frxETH (0x7bbE...7fa3)	3.00	112,565.20	100.00%	SDT	2,018.587	896	0.0080	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	xdai-WXDAI+USDC+USDT (0x7f90...F353)	3.00	112,565.20	100.00%	SDT	2,343.594	1,041	0.0092	CRV
  0x989225f2F9bA272aDbce6d579232C4113ee998D8 	USDC+crvUSD (0x4DEc...D69E)	100	33008.84	0.73%	SDT	505.461	224	0.0068	CRV
  0x73Eb240a06f0e0747C698A219462059be6AacCc8 	USDC+crvUSD (0x4DEc...D69E)	100	494751.5	10.99%	SDT	7,576.077	3,365	0.0068	CRV
  0xB325c1AC788f02fF7997cF53C6FF40Dd762897B3	USDT+crvUSD (0x390f...7BF4)	100	517705.2	34.49%	SDT	7,116.875	3,161	0.0061	CRV
  0x7a16fF8270133F063aAb6C9977183D9e72835428	USDC+crvUSD (0x4DEc...D69E)	100	1829419	40.65%	SDT	28,013.698	12,441	0.0068	CRV
  0xec70538bEac744eec5eDec4b329205a4b29Ba8AE	ALCX+FRAXBP (0x4149...9D31)	100	39228.9	5.74%	SDT	58.209	26	0.0007	CRV
  0xf872703F1C8f93fA186869Bac83BAC5A0c87C3c8	ALCX+FRAXBP (0x4149...9D31)	16.66667	643701.8	94.26%	SDT	955.138	424	0.0007	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	50RBN-50USDC - 0x81C452E84B10355...65	18	8667.113	64.09%	sdBAL	114.277	1,637	0.1888	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	80D2D-20USDC - 0x1249c510e066731...9e	38	18297.24	79.03%	sdBAL	188.535	2,700	0.1476	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ankrETH/wstETH - 0xbf65b3fA6c20876...48	42	20223.26	60.97%	sdBAL	299.267	4,286	0.2119	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86...11	2	963.0126	16.55%	sdBAL	14.934	214	0.2221	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	50RBN-50USDC - 0x81C452E84B10355...65	15	4855.252	35.91%	sdBAL	64.017	917	0.1888	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	80D2D-20USDC - 0x1249c510e066731...9e	15	4855.252	20.97%	sdBAL	50.029	716	0.1476	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ankrETH/wstETH - 0xbf65b3fA6c20876...48	40	12947.34	39.03%	sdBAL	191.597	2,744	0.2119	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86...11	15	4855.252	83.45%	sdBAL	75.295	1,078	0.2221	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-sdBAL-STABLE - 0xDc2Df969EE5E662...f2	15	4855.252	37.93%	sdBAL	52.961	758	0.1562	BAL
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	B-sdBAL-STABLE - 0xDc2Df969EE5E662...f2	100	7944.575	62.07%	sdBAL	86.659	1,241	0.1562	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Convex stkcvxCOILFRAXBP	100	326734.7	66.21%	sdFXS	338.215	2,142	0.0066	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Convex stkcvxCOILFRAXBP	100	166756.3	33.79%	sdFXS	172.615	1,093	0.0066	FXS`;

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
  const crvIdProposal = "0x2dd4428c01ee94f69046aa178d9bcdaa7198a5a7023e627570f9eaa00bfe20e3";
  const balIdProposal = "0x10fb7d8ea9df566f6f88ac08252fcadfb63d20e1bf5e1b7faecf817fe79551da";
  const fraxIdProposal = "0x59deeb6886fbddc632d3cf46ad61540cc11e79123b060981453c0ad9e5801af9";
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