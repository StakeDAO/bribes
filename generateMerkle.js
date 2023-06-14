const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const firstTab = `50RBN-50USDC - 0x81C452E84B10355…65	13/06/2023	28,234.00	RBN	0.15	4,338.25	SDT	0.38	11,412.77	BAL
80D2D-20USDC - 0x1249c510e066731…9e	13/06/2023	2,297.00	USDC	1.00	2,296.82	SDT	0.38	6,042.31	BAL
80Silo-20WETH - 0x6661136537dfDCA…5E	13/06/2023	12,592.00	Silo	0.06	693.66	SDT	0.38	1,824.83	BAL
B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11	13/06/2023	183.17	BAL	4.45	815.10	SDT	0.38	2,144.31	BAL
B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	13/06/2023	4,792.00	SDT	0.39	1,865.49	SDT	0.38	4,907.60	BAL
swETH-bb-a-WETH-BPT - 0x11Ff498C7c2A29f…A5	13/06/2023	1.14	swETH	1,783.97	2,033.73	SDT	0.38	5,350.20	BAL
COIL+FRAXBP (0xAF42…DF33)	13/06/2023	51.55	FXS	4.94	254.65	SDT	0.38	669.92	CRV
COIL+FRAXBP (0xAF42…DF33)	13/06/2023	12,095.00	SPR	2.42	29,318.56	SDT	0.38	77,129.23	CRV
ETH+LDO (0x9409…72B5)	13/06/2023	7,006.00	LDO	1.82	12,750.63	SDT	0.38	33,543.47	CRV
ETH+OETH (0x94B1…13E7)	13/06/2023	1,704,240.00	OGV	0.01	13,750.80	SDT	0.38	36,174.65	CRV
ETH+msETH (0xc897…0025)	13/06/2023	4,715.00	MET	1.30	6,129.71	SDT	0.38	16,125.61	CRV
GUSD+FRAXBP (0x4e43…8D93)	13/06/2023	262.20	FXS	4.94	1,295.31	SDT	0.38	3,407.61	CRV
LUSD+FRAXBP (0x497C…fd25)	13/06/2023	262.90	FXS	4.94	1,298.72	SDT	0.38	3,416.58	CRV
OGV+ETH (0xB5ae…D58c)	13/06/2023	493,914.00	OGV	0.01	3,984.46	SDT	0.38	10,482.04	CRV
OHM+FRAXBP (0xFc1e…E48D)	13/06/2023	262.20	FXS	4.94	1,295.31	SDT	0.38	3,407.61	CRV
USDT+WBTC+WETH (0xD51a…AE46)	13/06/2023	50,402.00	CRV	0.65	32,975.14	SDT	0.38	86,748.70	CRV
WACME+frxETH (0x7bbE…7fa3)	13/06/2023	6.49	FXS	4.94	32.03	SDT	0.38	84.26	CRV
WACME+frxETH (0x7bbE…7fa3)	13/06/2023	25,765.00	WACME	0.03	798.00	SDT	0.38	2,099.32	CRV
WETH+CRV (0x8301…C511)	13/06/2023	41,762.00	CRV	0.65	27,328.93	SDT	0.38	71,895.05	CRV
XAI+FRAXBP (0x3262…b669)	13/06/2023	262.90	FXS	4.94	1,298.72	SDT	0.38	3,416.58	CRV
arbitrum-FRAX+USDC (0xC9B8…40d5)	13/06/2023	152.64	FXS	4.94	754.04	SDT	0.38	1,983.68	CRV
arbitrum-USDT+WBTC+WETH (0x960e…5590)	13/06/2023	6,971.00	CRV	0.65	4,560.23	SDT	0.38	11,996.74	CRV
arbitrum-VST+FRAX (0x59bF…6Ba4)	13/06/2023	723.17	FXS	4.94	3,572.45	SDT	0.38	9,398.15	CRV
eCFX+ETH (0x5ac4…3F38)	13/06/2023	16,902.00	eCFX	0.17	2,955.61	SDT	0.38	7,775.41	CRV
msUSD+FRAXBP (0xc3b1…51dD)	13/06/2023	1,060.00	MET	1.30	1,377.93	SDT	0.38	3,624.96	CRV
optimism-FRAX+USDC (0x29A3…bFe7)	13/06/2023	242.21	FXS	4.94	1,196.51	SDT	0.38	3,147.70	CRV
polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7)	13/06/2023	12,892.00	CRV	0.65	8,436.72	SDT	0.38	22,194.74	CRV
sUSD+FRAXBP (0xe3c1…f5eF)	13/06/2023	141.47	FXS	4.94	698.86	SDT	0.38	1,838.51	CRV
xdai-WXDAI+USDC+USDT (0x7f90…F353)	13/06/2023	20.80	GNO	109.37	2,274.83	SDT	0.38	5,984.46	CRV
Temple FRAX/TEMPLE	13/06/2023	3,158.00	DAI	1.00	3,154.83	sdFXS	5.51	572.08	FXS
Convex stkcvxSDTFRAXBP	13/06/2023	147.33	sdFXS	4.88	718.92	sdFXS	5.51	130.36	FXS`;

  const secondTab = `0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	arbitrum-FRAX+USDC (0xC9B8…40d5)	3.00	496,695.76	100.00%	SDT	1,983.676	754	0.0015	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	arbitrum-USDT+WBTC+WETH (0x960e…5590)	4.00	662,261.01	100.00%	SDT	11,996.736	4,560	0.0069	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	arbitrum-VST+FRAX (0x59bF…6Ba4)	2.50	413,913.13	71.04%	SDT	6,676.804	2,538	0.0061	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	eCFX+ETH (0x5ac4…3F38)	2.50	413,913.13	55.09%	SDT	4,283.584	1,628	0.0039	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+LDO (0x9409…72B5)	11.50	1,904,000.41	100.00%	SDT	33,543.470	12,751	0.0067	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+msETH (0xc897…0025)	2.00	331,130.51	49.53%	SDT	7,987.103	3,036	0.0092	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+OETH (0x94B1…13E7)	6.00	993,391.52	54.76%	SDT	19,810.013	7,530	0.0076	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	OGV+ETH (0xB5ae…D58c)	2.00	331,130.51	66.25%	SDT	6,944.148	2,640	0.0080	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7)	7.50	1,241,739.40	100.00%	SDT	22,194.736	8,437	0.0068	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	sUSD+FRAXBP (0xe3c1…f5eF)	3.00	496,695.76	100.00%	SDT	1,838.512	699	0.0014	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xD51a…AE46)	31.00	5,132,522.86	100.00%	SDT	86,748.703	32,975	0.0064	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	WETH+CRV (0x8301…C511)	25.00	4,139,131.34	97.61%	SDT	70,178.826	26,677	0.0064	CRV
0xa7888F85BD76deeF3Bd03d4DbCF57765a49883b3	COIL+FRAXBP (0xAF42…DF33)	100.00	1,922,739.56	51.08%	SDT	39,739.967	15,106	0.0079	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	arbitrum-VST+FRAX (0x59bF…6Ba4)	5.00	168,703.80	28.96%	SDT	2,721.349	1,034	0.0061	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	eCFX+ETH (0x5ac4…3F38)	10.00	337,407.60	44.91%	SDT	3,491.829	1,327	0.0039	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+msETH (0xc897…0025)	10.00	337,407.60	50.47%	SDT	8,138.511	3,094	0.0092	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+OETH (0x94B1…13E7)	15.00	506,111.41	27.90%	SDT	10,092.771	3,836	0.0076	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	GUSD+FRAXBP (0x4e43…8D93)	5.00	168,703.80	100.00%	SDT	3,407.611	1,295	0.0077	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	LUSD+FRAXBP (0x497C…fd25)	5.00	168,703.80	100.00%	SDT	3,416.582	1,299	0.0077	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	msUSD+FRAXBP (0xc3b1…51dD)	5.00	168,703.80	100.00%	SDT	3,624.962	1,378	0.0082	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	OGV+ETH (0xB5ae…D58c)	5.00	168,703.80	33.75%	SDT	3,537.892	1,345	0.0080	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	OHM+FRAXBP (0xFc1e…E48D)	5.00	168,703.80	100.00%	SDT	3,407.611	1,295	0.0077	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	optimism-FRAX+USDC (0x29A3…bFe7)	5.00	168,703.80	100.00%	SDT	3,147.695	1,197	0.0071	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	WACME+frxETH (0x7bbE…7fa3)	2.00	67,481.52	100.00%	SDT	2,183.585	830	0.0123	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	WETH+CRV (0x8301…C511)	3.00	101,222.28	2.39%	SDT	1,716.220	652	0.0064	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	XAI+FRAXBP (0x3262…b669)	5.00	168,703.80	100.00%	SDT	3,416.582	1,299	0.0077	CRV
0xb0e83C2D71A991017e0116d58c5765Abc57384af	xdai-WXDAI+USDC+USDT (0x7f90…F353)	5.00	168,703.80	100.00%	SDT	5,984.464	2,275	0.0135	CRV
0x73Eb240a06f0e0747C698A219462059be6AacCc8	ETH+OETH (0x94B1…13E7)	100.00	314,508.42	17.34%	SDT	6,271.863	2,384	0.0076	CRV
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Convex stkcvxSDTFRAXBP	20.00	62,418.12	45.60%	sdFXS	59.448	328	0.0053	FXS
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Temple FRAX/TEMPLE	80.00	249,672.49	60.90%	sdFXS	348.412	1,921	0.0077	FXS
0xb0e83C2D71A991017e0116d58c5765Abc57384af	Temple FRAX/TEMPLE	100.00	160,277.57	39.10%	sdFXS	223.664	1,233	0.0077	FXS
0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	Convex stkcvxSDTFRAXBP	100.00	74,458.96	54.40%	sdFXS	70.916	391	0.0053	FXS
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	50RBN-50USDC - 0x81C452E84B10355…65	29.70	11,638.40	46.51%	SDT	5,308.529	2,018	0.1734	BAL
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	80D2D-20USDC - 0x1249c510e066731…9e	35.64	13,966.07	100.00%	SDT	6,042.314	2,297	0.1645	BAL
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11	7.92	3,103.57	64.98%	SDT	1,393.301	530	0.1707	BAL
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	8.91	3,491.52	29.65%	SDT	1,455.152	553	0.1584	BAL
0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	swETH-bb-a-WETH-BPT - 0x11Ff498C7c2A29f…A5	17.82	6,983.04	51.07%	SDT	2,732.140	1,039	0.1487	BAL
0xb0e83C2D71A991017e0116d58c5765Abc57384af 	50RBN-50USDC - 0x81C452E84B10355…65	40	13382.9084	53.49%	SDT	6,104.237	2,320	0.1734	BAL
0xb0e83C2D71A991017e0116d58c5765Abc57384af 	80Silo-20WETH - 0x6661136537dfDCA…5E	20	6691.4542	100.00%	SDT	1,824.832	694	0.1037	BAL
0xb0e83C2D71A991017e0116d58c5765Abc57384af 	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11	5	1672.86355	35.02%	SDT	751.007	285	0.1707	BAL
0xb0e83C2D71A991017e0116d58c5765Abc57384af 	B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	15	5018.59065	42.62%	SDT	2,091.586	795	0.1584	BAL
0xb0e83C2D71A991017e0116d58c5765Abc57384af 	swETH-bb-a-WETH-BPT - 0x11Ff498C7c2A29f…A5	20	6691.4542	48.93%	SDT	2,618.056	995	0.1487	BAL
0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063 	B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	100	3265.281538	27.73%	SDT	1,360.863	517	0.1584	BAL
0xc47ec74a753acb09e4679979afc428cde0209639	COIL+FRAXBP (0xAF42…DF33)	100.00	1,841,417.76	48.92%	SDT	38,059.175	14,467	0.0079	CRV`;

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

    let bribe = bribes[locker].find((b) => b.gaugeName === columns[0]);
    if (bribe) {
      bribe.amount += parseFloat(columns[8]);
    } else {
      bribe = {
        gaugeName: columns[0],
        token: columns[6],
        symbol: columns[6],
        image: imagesPerToken[columns[6]],
        address: addressesPerToken[columns[6]],
        amount: parseFloat(columns[8]),
        decimals: 18,
      };
      bribes[locker].push(bribe);
    }
  }

  const bribesDelegationsAmounts = {};

  for (const row of secondTabRows) {
    const columns = row.split("\t");

    if (DELEGATION_ADDRESS.toLowerCase() !== columns[0].trim().toLowerCase()) {
      continue;
    }

    const locker = columns[9];
    let bribe = bribes[locker].find((b) => b.gaugeName === columns[1]);
    if (!bribe) {
      throw new Error("no bribe for " + locker);
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
  fs.writeFileSync(`tmp/bribesDelegationsAmounts.json`, JSON.stringify(bribesDelegationsAmounts));

  return {
    bribes,
    bribesDelegationsAmounts
  };
};

const main = async () => {

  /*********** Inputs ********/
  const crvIdProposal = "0x640a70608ae6eff4f905e125ebb66278d86623fcb559397e929e8b10b531484e";
  const balIdProposal = "0x9852862ef40c35d664d477c6047cd2f711583cf093932b58766ef5f7c67304e2";
  const fraxIdProposal = "0xf6c83c798c65976383caf1e946c8de551e6153f3d0507d8fbbed6e0dbe3d50a5";
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