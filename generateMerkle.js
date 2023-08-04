const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const firstTab = `ALCX+FRAXBP (0x4149…9D31) - 0xd5be6a05b45aed5…87	4/8/2023	83.52	FXS	6.05	505.30	sdCRV	0.55	913.65	CRV
COIL+FRAXBP (0xAF42…DF33) - 0x06b30d5f2341c2f…72	4/8/2023	21,277.79	CRV	0.57	12,229.04	sdCRV	0.55	22,111.75	CRV
ETH+OETH (0x94B1…13E7) - 0xd03be91b1932715…15	4/8/2023	1,493,375.88	OGV	0.01	11,663.04	sdCRV	0.55	21,088.34	CRV
ETH+msETH (0xc897…0025) - 0x941c2acdb6b8557…03	4/8/2023	2,756.79	MET	1.12	3,087.60	sdCRV	0.55	5,582.80	CRV
ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	4/8/2023	7,908.38	LDO	1.87	14,788.67	sdCRV	0.55	26,739.90	CRV
OGV+ETH (0xB5ae…D58c) - 0x98ff4ee7524c501…94	4/8/2023	131,089.19	OGV	0.01	1,023.78	sdCRV	0.55	1,851.13	CRV
USDC+WBTC+WETH (0x7F86…829B) - 0x85d44861d024cb7…f6	4/8/2023	20,763.64	CRV	0.57	11,933.58	sdCRV	0.55	21,577.51	CRV
USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	4/8/2023	17,890.34	CRV	0.57	10,282.29	sdCRV	0.55	18,591.76	CRV
USDT+WBTC+WETH (0xD51a…AE46) - 0xdefd8fdd20e0f34…68	4/8/2023	9,531.38	CRV	0.57	5,477.67	sdCRV	0.55	9,904.36	CRV
USDT+WBTC+WETH (0xf5f5…e2B4) - 0xf29fff074f5cf75…a2	4/8/2023	27,461.13	CRV	0.57	15,782.82	sdCRV	0.55	28,537.46	CRV
USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	4/8/2023	25,221.98	CRV	0.57	14,495.02	sdCRV	0.55	26,208.94	CRV
WETH+CRV (0x8301…C511) - 0x1cebdb0856dd985…a6	4/8/2023	32,715.48	CRV	0.57	18,801.52	sdCRV	0.55	33,995.67	CRV
crvUSD+tBTC+wstETH (0x2889…3D13) - 0x60d3d7ebbc44dc8…7e	4/8/2023	10,225.46	LDO	1.87	19,121.61	sdCRV	0.55	34,574.44	CRV
UZD+FRAXBP (0x6893…de3a) - 0xbdca4f610e7101c…30	4/8/2023	6,398.41	CRV	0.57	3,677.38	sdCRV	0.55	6,649.20	CRV
dETH+frxETH (0x7C0d…98E4) - 0x688eb2c49d352c9…3e	4/8/2023	32.98	FXS	6.05	199.54	sdCRV	0.55	360.80	CRV
polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7) - 0x40371aad2a24ed8…6c	4/8/2023	6,060.91	CRV	0.57	3,483.40	sdCRV	0.55	6,298.45	CRV
xdai-WXDAI+USDC+USDT (0x7f90…F353) - 0xb721cc32160ab0d…01	4/8/2023	8.72	GNO	111.89	975.64	sdCRV	0.55	1,764.09	CRV
Convex stkcvxCOILFRAXBP - 0x39cd4db6460d8b5…f6	4/8/2023	63.94	FXS	6.05	386.83	sdFXS	6.58	58.82	FXS
Temple FRAX/TEMPLE - 0x10460d02226d6ef…16	4/8/2023	4,581.36	DAI	1.00	4,585.94	sdFXS	6.58	697.31	FXS
Vesper Orbit FRAX - 0x698137c473bc1f0…d6	4/8/2023	153.99	VSP	0.33	50.36	sdFXS	6.58	7.66	FXS
50RBN-50USDC - 0x81C452E84B10355…65	4/8/2023	8,027.73	RBN	0.20	1,637.61	sdBAL	11.74	139.49	BAL
80D2D-20USDC - 0x1249c510e066731…9e 	4/8/2023	1,773.76	USDC	1.00	1,773.64	sdBAL	11.74	151.08	BAL
B-baoETH-ETH-BPT - 0xD449Efa0A587f2c…10 	4/8/2023	241.24	BAL	4.24	1,022.87	sdBAL	11.74	87.13	BAL
B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11 	4/8/2023	503.57	BAL	4.24	2,135.15	sdBAL	11.74	181.87	BAL
B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	4/8/2023	1,848.55	SDT	0.36	661.53	sdBAL	11.74	56.35	BAL
ankrETH/wstETH - 0xbf65b3fA6c20876…48 	4/8/2023	61,643.54	ANKR	0.02	1,501.74	sdBAL	11.74	127.92	BAL
50WETH-50AURA - 0x275dF57d2B23d53…00	4/8/2023	1,353.00	AURA	1.27	1,712.55	sdBAL	11.74	145.88	BAL
rETH-bb-a-WETH-BPT - 0xb12ADA23eE766bd…7c 	4/8/2023	506.07	USDC	1.00	506.07	sdBAL	11.74	43.11	BAL
rETH-bb-a-WETH-BPT - 0xb12ADA23eE766bd…7c 	4/8/2023	9.27	RPL	28.19	261.33	sdBAL	11.74	22.26	BAL`;

  const secondTab = `0xec70538bEac744eec5eDec4b329205a4b29Ba8AE	ALCX+FRAXBP (0x4149…9D31) - 0xd5be6a05b45aed5…87	100.00	38,343.05	13.22%	sdCRV	120.777	67	0.0017	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	crvUSD+tBTC+wstETH (0x2889…3D13) - 0x60d3d7ebbc44dc8…7e	8.10	1,788,605.26	60.61%	sdCRV	20,955.157	11,589	0.0065	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+msETH (0xc897…0025) - 0x941c2acdb6b8557…03	4.80	1,059,914.23	100.00%	sdCRV	5,582.795	3,088	0.0029	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+OETH (0x94B1…13E7) - 0xd03be91b1932715…15	7.10	1,567,789.80	91.22%	sdCRV	19,237.220	10,639	0.0068	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	8.60	1,899,013.00	80.75%	sdCRV	21,593.564	11,942	0.0063	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7) - 0x40371aad2a24ed8…6c	2.70	596,201.75	100.00%	sdCRV	6,298.455	3,483	0.0058	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	3.60	794,935.67	36.25%	sdCRV	6,739.879	3,728	0.0047	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+WBTC+WETH (0x7F86…829B) - 0x85d44861d024cb7…f6	8.90	1,965,257.63	91.24%	sdCRV	19,688.308	10,889	0.0055	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	5.60	1,236,566.60	47.52%	sdCRV	12,454.623	6,888	0.0056	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xD51a…AE46) - 0xdefd8fdd20e0f34…68	5.30	1,170,321.96	100.00%	sdCRV	9,904.362	5,478	0.0047	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xf5f5…e2B4) - 0xf29fff074f5cf75…a2	11.60	2,561,459.39	86.06%	sdCRV	24,559.617	13,583	0.0053	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	UZD+FRAXBP (0x6893…de3a) - 0xbdca4f610e7101c…30	3.00	662,446.39	100.00%	sdCRV	6,649.197	3,677	0.0056	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	WETH+CRV (0x8301…C511) - 0x1cebdb0856dd985…a6	30.70	6,779,034.76	97.29%	sdCRV	33,075.582	18,293	0.0027	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	crvUSD+tBTC+wstETH (0x2889…3D13) - 0x60d3d7ebbc44dc8…7e	18.00	678,879.99	23.00%	sdCRV	7,953.704	4,399	0.0065	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	dETH+frxETH (0x7C0d…98E4) - 0x688eb2c49d352c9…3e	14.00	528,017.77	100.00%	sdCRV	360.795	200	0.0004	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+OETH (0x94B1…13E7) - 0xd03be91b1932715…15	4.00	150,862.22	8.78%	sdCRV	1,851.122	1,024	0.0068	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	12.00	452,586.66	19.25%	sdCRV	5,146.336	2,846	0.0063	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	OGV+ETH (0xB5ae…D58c) - 0x98ff4ee7524c501…94	4.00	150,862.22	100.00%	sdCRV	1,851.132	1,024	0.0068	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af 	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	5.00	188,577.78	8.60%	sdCRV	1,598.861	884	0.0047	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDC+WBTC+WETH (0x7F86…829B) - 0x85d44861d024cb7…f6	5.00	188,577.78	8.76%	sdCRV	1,889.206	1,045	0.0055	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	5.00	188,577.78	7.25%	sdCRV	1,899.344	1,050	0.0056	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDT+WBTC+WETH (0xf5f5…e2B4) - 0xf29fff074f5cf75…a2	11.00	414,871.11	13.94%	sdCRV	3,977.840	2,200	0.0053	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	WETH+CRV (0x8301…C511) - 0x1cebdb0856dd985…a6	5.00	188,577.78	2.71%	sdCRV	920.090	509	0.0027	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	xdai-WXDAI+USDC+USDT (0x7f90…F353) - 0xb721cc32160ab0d…01	3.00	113,146.67	100.00%	sdCRV	1,764.088	976	0.0086	CRV
  0x73Eb240a06f0e0747C698A219462059be6AacCc8	crvUSD+tBTC+wstETH (0x2889…3D13) - 0x60d3d7ebbc44dc8…7e	100.00	483,579.29	16.39%	sdCRV	5,665.576	3,133	0.0065	CRV
  0x79603115Df2Ba00659ADC63192325CF104ca529C	COIL+FRAXBP (0xAF42…DF33) - 0x06b30d5f2341c2f…72	100.00	2,576,747.09	100.00%	sdCRV	22,111.745	12,229	0.0047	CRV
  0xB325c1AC788f02fF7997cF53C6FF40Dd762897B3	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	50.00	253,007.30	11.54%	sdCRV	2,145.128	1,186	0.0047	CRV
  0xB325c1AC788f02fF7997cF53C6FF40Dd762897B3	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	50.00	253,007.30	9.72%	sdCRV	2,548.274	1,409	0.0056	CRV
  0x7a16fF8270133F063aAb6C9977183D9e72835428	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	50.00	924,022.75	42.14%	sdCRV	7,834.346	4,333	0.0047	CRV
  0x7a16fF8270133F063aAb6C9977183D9e72835428	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	50.00	924,022.75	35.51%	sdCRV	9,306.700	5,147	0.0056	CRV
  0x989225f2F9bA272aDbce6d579232C4113ee998D8	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	100.00	32,263.45	1.47%	sdCRV	273.546	151	0.0047	CRV
  0xf872703F1C8f93fA186869Bac83BAC5A0c87C3c8	ALCX+FRAXBP (0x4149…9D31) - 0xd5be6a05b45aed5…87 	6.67	251,713.60	86.78%	sdCRV	792.873	439	0.0017	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	50RBN-50USDC - 0x81C452E84B10355…65	3.00	1,152.51	14.16%	sdBAL	19.755	232	0.2012	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	50WETH-50AURA - 0x275dF57d2B23d53…00	40.00	15,366.80	100.00%	sdBAL	145.875	1,713	0.1114	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	80D2D-20USDC - 0x1249c510e066731…9e 	10.00	3,841.70	26.83%	sdBAL	40.530	476	0.1239	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ankrETH/wstETH - 0xbf65b3fA6c20876…48 	12.00	4,610.04	37.50%	sdBAL	47.966	563	0.1222	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoETH-ETH-BPT - 0xD449Efa0A587f2c…10 	17.00	6,530.89	100.00%	sdBAL	87.128	1,023	0.1566	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11 	10.00	3,841.70	28.20%	sdBAL	51.294	602	0.1567	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	rETH-bb-a-WETH-BPT - 0xb12ADA23eE766bd…7c 	8.00	3,073.36	100.00%	sdBAL	65.367	767	0.2497	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	50RBN-50USDC - 0x81C452E84B10355…65	20.00	6,985.58	85.84%	sdBAL	119.737	1,406	0.2012	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	80D2D-20USDC - 0x1249c510e066731…9e 	30.00	10,478.37	73.17%	sdBAL	110.548	1,298	0.1239	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ankrETH/wstETH - 0xbf65b3fA6c20876…48 	22.00	7,684.13	62.50%	sdBAL	79.952	939	0.1222	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11 	28.00	9,779.81	71.80%	sdBAL	130.578	1,533	0.1567	BAL
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	100.00	8,523.49	100.00%	sdBAL	56.349	662	0.0776	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Temple FRAX/TEMPLE - 0x10460d02226d6ef…16	100.00	653,566.12	85.74%	sdFXS	597.843	3,932	0.0060	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Convex stkcvxCOILFRAXBP - 0x39cd4db6460d8b5…f6 	40.00	72,494.50	100.00%	sdFXS	58.819	387	0.0053	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Temple FRAX/TEMPLE - 0x10460d02226d6ef…16 	60.00	108,741.74	14.26%	sdFXS	99.470	654	0.0060	FXS
  0x799D99103868Cda7422995AcCEB36Df2CA646a38	Vesper Orbit FRAX - 0x698137c473bc1f0…d6 	100.00	5,086.01	100.00%	sdFXS	7.657	50	0.0099	FXS`;

const SKIP_MERKLE_TOKENS = []

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

const ALL_CLAIMED_QUERY = (since, end, tokenAddress) => `
SELECT
    input_3_value_address as user,
    input_0_value_address as token
FROM evm_events_ethereum_mainnet
WHERE
    address = '0x03E34b085C52985F6a5D27243F20C84bDdc01Db4' and
    timestamp > '${since}' and
    timestamp <= '${end}' and
    input_0_value_address = '${tokenAddress}' and
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

  let lastClaimTimestamp = lastClaim[0][0];
  let lastUpdateTimestamp = lastUpdate[0][0];

  if(tokenAddress.toLowerCase() === "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599".toLowerCase()) {
    lastUpdateTimestamp = 0;
  }
  
  // Get all claimed
  const allClaimed = await agnosticFetch(ALL_CLAIMED_QUERY(lastUpdateTimestamp, lastClaimTimestamp, tokenAddress));
  
  // Create map token => users
  const resp = {};
  if(!allClaimed) {
    return resp;  
  }

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
    for(let i = 0; i < columns.length; i++) {
      columns[i] = columns[i].trim();
    }

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
    for(let i = 0; i < columns.length; i++) {
      columns[i] = columns[i].trim();
    }

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
  const crvIdProposal = "0x0c257e30b2d519533a0b73b907f631d879fcf1a1f9e49f5055e6a95dedd0cfa1";
  const balIdProposal = "0x0287b54e744753bf5fb6eef99ab08a47a56fe1a79d4425c5a71a1ff9270a77e2";
  const fraxIdProposal = "0x0dc94f0b61e1d2260776146489e775c8a7455f85e28438b939a7fed670362cd5";
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