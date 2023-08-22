const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require('fs');
const orderBy = require("lodash/orderBy");
const { gql, request } = require("graphql-request");
const axios = require('axios').default;
const { ethers, utils, BigNumber } = require("ethers");

const firstTab = `ALCX+FRAXBP (0x4149…9D31) - 0xd5be6a05b45aed5…87	22/08/2023	68.16	FXS	6.12	417.14	sdCRV	0.48	860.45	CRV
COIL+FRAXBP (0xAF42…DF33) - 0x06b30d5f2341c2f…72	22/08/2023	43,829.88	CRV	0.47	20,644.10	sdCRV	0.48	42,583.51	CRV
ETH+LDO (0x9409…72B5) - 0xe5d5aa1bbe72f68…32	22/08/2023	2,836.43	LDO	1.65	4,680.11	sdCRV	0.48	9,653.87	CRV
ETH+OETH (0x94B1…13E7) - 0xd03be91b1932715…15	22/08/2023	1,718,285.68	OGV	0.01	11,364.01	sdCRV	0.48	23,441.05	CRV
ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	22/08/2023	8,482.54	LDO	1.65	13,996.19	sdCRV	0.48	28,870.57	CRV
OGV+ETH (0xB5ae…D58c) - 0x98ff4ee7524c501…94	22/08/2023	132,320.40	OGV	0.01	875.11	sdCRV	0.48	1,805.13	CRV
USDC+WBTC+WETH (0x7F86…829B) - 0x85d44861d024cb7…f6	22/08/2023	23,274.50	CRV	0.47	10,962.46	sdCRV	0.48	22,612.76	CRV
USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	22/08/2023	12,518.27	CRV	0.47	5,896.39	sdCRV	0.48	12,162.75	CRV
USDT+WBTC+WETH (0xf5f5…e2B4) - 0xf29fff074f5cf75…a2	22/08/2023	21,836.89	CRV	0.47	10,285.61	sdCRV	0.48	21,216.59	CRV
USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	22/08/2023	30,259.35	CRV	0.47	14,244.32	sdCRV	0.48	29,382.39	CRV
crvUSD+tBTC+wstETH (0x2889…3D13) - 0x60d3d7ebbc44dc8…7e	22/08/2023	7,880.71	LDO	1.65	13,003.16	sdCRV	0.48	26,822.20	CRV
crvUSD+WETH+CRV (0x4eBd…4A14) - 0x8d867bef70c6733…17	22/08/2023	35,223.67	CRV	0.47	16,580.02	sdCRV	0.48	34,200.35	CRV
UZD+crvUSD (0xfC63…F28C) - 0xe39c817fe25ac1a…ef	22/08/2023	10,228.18	CRV	0.47	4,814.48	sdCRV	0.48	9,931.04	CRV
dETH+frxETH (0x7C0d…98E4) - 0x688eb2c49d352c9…3e	22/08/2023	36.95	FXS	6.13	226.48	sdCRV	0.48	467.17	CRV
polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7) - 0x40371aad2a24ed8…6c	22/08/2023	14,061.63	CRV	0.47	6,619.15	sdCRV	0.48	13,653.62	CRV
xdai-WXDAI+USDC+USDT (0x7f90…F353) - 0xb721cc32160ab0d…01	22/08/2023	10.48	GNO	100.59	1,054.21	sdCRV	0.48	2,174.57	CRV
Convex stkcvxCOILFRAXBP - 0x39cd4db6460d8b5…f6	22/08/2023	522.33	FXS	6.12	3,196.64	sdFXS	6.18	517.56	FXS
Fraxswap V2 FRAX/IQ - 0x7af00cf8d3a8a75…5b	22/08/2023	99,264.15	IQ	0.00	427.99	sdFXS	6.18	69.29	FXS
Temple FRAX/TEMPLE - 0x10460d02226d6ef…16	22/08/2023	1,025.60	DAI	1.00	1,025.46	sdFXS	6.18	166.03	FXS
50RBN-50USDC - 0x81C452E84B10355…65	22/08/2023	11,011.23	RBN	0.22	2,417.56	sdBAL	10.42	232.01	BAL
B-baoETH-ETH-BPT - 0xD449Efa0A587f2c…10	22/08/2023	272.07	BAL	3.60	979.47	sdBAL	10.42	94.00	BAL
B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11	22/08/2023	326.64	BAL	3.60	1,175.91	sdBAL	10.42	112.85	BAL
B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2	22/08/2023	3,544.32	SDT	0.33	1,180.70	sdBAL	10.42	113.31	BAL
ankrETH/wstETH - 0xbf65b3fA6c20876…48	22/08/2023	84,030.77	ANKR	0.02	1,658.93	sdBAL	10.42	159.20	BAL
USDC-PAL - 0xe2b680A8d02fbf4…87 	22/08/2024	4,125.95	PAL	0.10	410.09	sdBAL	10.42	39.36	BAL
ankrETH/wstETH - 0xbf65b3fA6c20876…48	22/08/2025	1,290.55	USDC	1.00	1,290.55	sdBAL	10.42	123.85	BAL`;

  const secondTab = `0x73Eb240a06f0e0747C698A219462059be6AacCc8	crvUSD+WETH+CRV (0x4eBd…4A14) - 0x8d867bef70c6733…17	100.00	471,399.76	9.92%	sdCRV	3,394.163	1,645	0.0035	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	COIL+FRAXBP (0xAF42…DF33) - 0x06b30d5f2341c2f…72	13.40	2,816,971.95	59.45%	sdCRV	25,313.824	12,272	0.0044	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	crvUSD+tBTC+wstETH (0x2889…3D13) - 0x60d3d7ebbc44dc8…7e	9.90	2,081,195.69	100.00%	sdCRV	26,822.198	13,003	0.0062	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	crvUSD+WETH+CRV (0x4eBd…4A14) - 0x8d867bef70c6733…17	13.30	2,795,949.77	58.86%	sdCRV	20,131.340	9,759	0.0035	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+LDO (0x9409…72B5) - 0xe5d5aa1bbe72f68…32	3.40	714,754.08	100.00%	sdCRV	9,653.872	4,680	0.0065	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+OETH (0x94B1…13E7) - 0xd03be91b1932715…15	7.40	1,555,641.23	90.63%	sdCRV	21,244.207	10,299	0.0066	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	8.50	1,786,885.19	78.64%	sdCRV	22,702.864	11,006	0.0062	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	polygon-CRV+crvUSDBTCETH (0xc7c9…8Fa7) - 0x40371aad2a24ed8…6c	5.20	1,093,153.29	100.00%	sdCRV	13,653.616	6,619	0.0061	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	4.70	988,042.40	80.02%	sdCRV	9,733.157	4,719	0.0048	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDC+WBTC+WETH (0x7F86…829B) - 0x85d44861d024cb7…f6	9.20	1,934,040.44	100.00%	sdCRV	22,612.755	10,962	0.0057	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	13.20	2,774,927.59	86.11%	sdCRV	25,300.327	12,265	0.0044	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	USDT+WBTC+WETH (0xf5f5…e2B4) - 0xf29fff074f5cf75…a2	9.20	1,934,040.44	100.00%	sdCRV	21,216.587	10,286	0.0053	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	UZD+crvUSD (0xfC63…F28C) - 0xe39c817fe25ac1a…ef	2.60	546,576.65	73.10%	sdCRV	7,260.078	3,520	0.0064	CRV
  0x3bAf04a1dAccB03F4806694Cf1a266E1C4DF1310	crvUSD+WETH+CRV (0x4eBd…4A14) - 0x8d867bef70c6733…17	100.00	3,323.08	0.07%	sdCRV	23.927	12	0.0035	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	crvUSD+WETH+CRV (0x4eBd…4A14) - 0x8d867bef70c6733…17	36.00	1,447,806.43	30.48%	sdCRV	10,424.466	5,054	0.0035	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	dETH+frxETH (0x7C0d…98E4) - 0x688eb2c49d352c9…3e	25.00	1,005,421.13	100.00%	sdCRV	467.170	226	0.0002	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ETH+OETH (0x94B1…13E7) - 0xd03be91b1932715…15	4.00	160,867.38	9.37%	sdCRV	2,196.843	1,065	0.0066	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af 	ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	5.00	201,084.23	8.85%	sdCRV	2,554.830	1,239	0.0062	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	OGV+ETH (0xB5ae…D58c) - 0x98ff4ee7524c501…94	4.00	160,867.38	100.00%	sdCRV	1,805.128	875	0.0054	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	5.00	201,084.23	6.24%	sdCRV	1,833.380	889	0.0044	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	UZD+crvUSD (0xfC63…F28C) - 0xe39c817fe25ac1a…ef	5.00	201,084.23	26.90%	sdCRV	2,670.965	1,295	0.0064	CRV
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	xdai-WXDAI+USDC+USDT (0x7f90…F353) - 0xb721cc32160ab0d…01	3.00	120,650.54	100.00%	sdCRV	2,174.566	1,054	0.0087	CRV
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	ETH+stETH (0x21E2…843a) - 0x79f21bc30632cd4…aa	10.00	284,360.06	12.51%	sdCRV	3,612.872	1,751	0.0062	CRV
  0xB325c1AC788f02fF7997cF53C6FF40Dd762897B3	USDC+crvUSD (0x4DEc…D69E) - 0x95f00391cb5eebc…c1	50.00	246,635.00	19.98%	sdCRV	2,429.589	1,178	0.0048	CRV
  0xB325c1AC788f02fF7997cF53C6FF40Dd762897B3	USDT+crvUSD (0x390f…7BF4) - 0x4e6bb6b7447b7b2…39	50.00	246,635.00	7.65%	sdCRV	2,248.688	1,090	0.0044	CRV
  0x79603115Df2Ba00659ADC63192325CF104ca529C	COIL+FRAXBP (0xAF42…DF33) - 0x06b30d5f2341c2f…72	100.00	1,921,804.13	40.55%	sdCRV	17,269.682	8,372	0.0044	CRV
  0xf872703F1C8f93fA186869Bac83BAC5A0c87C3c8	ALCX+FRAXBP (0x4149…9D31) - 0xd5be6a05b45aed5…87	25.00	920,152.07	100.00%	sdCRV	860.453	417	0.0005	CRV
  0x989225f2F9bA272aDbce6d579232C4113ee998D8	crvUSD+WETH+CRV (0x4eBd…4A14) - 0x8d867bef70c6733…17	100.00	31,450.85	0.66%	sdCRV	226.452	110	0.0035	CRV
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Convex stkcvxCOILFRAXBP - 0x39cd4db6460d8b5…f6	70.00	492,209.94	87.21%	sdFXS	451.342	2,788	0.0057	FXS
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	Temple FRAX/TEMPLE - 0x10460d02226d6ef…16	30.00	210,947.12	100.00%	sdFXS	166.029	1,025	0.0049	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Convex stkcvxCOILFRAXBP - 0x39cd4db6460d8b5…f6	40.00	72,210.89	12.79%	sdFXS	66.215	409	0.0057	FXS
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	Fraxswap V2 FRAX/IQ - 0x7af00cf8d3a8a75…5b 	60.00	108,316.33	100.00%	sdFXS	69.294	428	0.0040	FXS
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	50RBN-50USDC - 0x81C452E84B10355…65	30.00	11,473.68	51.80%	sdBAL	120.189	1,252	0.1092	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	ankrETH/wstETH - 0xbf65b3fA6c20876…48	50.00	19,122.80	72.88%	sdBAL	206.286	2,150	0.1124	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoETH-ETH-BPT - 0xD449Efa0A587f2c…10 	8.50	3,250.88	31.36%	sdBAL	29.475	307	0.0945	BAL
  0x52ea58f4FC3CEd48fa18E909226c1f8A0EF887DC	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11 	11.50	4,398.24	38.20%	sdBAL	43.105	449	0.1021	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	50RBN-50USDC - 0x81C452E84B10355…65 	30.00	10,674.52	48.20%	sdBAL	111.818	1,165	0.1092	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	ankrETH/wstETH - 0xbf65b3fA6c20876…48 	20.00	7,116.35	27.12%	sdBAL	76.767	800	0.1124	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-baoETH-ETH-BPT - 0xD449Efa0A587f2c…10 	20.00	7,116.35	68.64%	sdBAL	64.522	672	0.0945	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	B-baoUSD-LUSD-BPT - 0x5aF3B93Fb82ab86…11	20.00	7,116.35	61.80%	sdBAL	69.744	727	0.1021	BAL
  0xb0e83C2D71A991017e0116d58c5765Abc57384af	USDC-PAL - 0xe2b680A8d02fbf4…87 	10.00	3,558.17	100.00%	sdBAL	39.355	410	0.1153	BAL
  0xF930EBBd05eF8b25B1797b9b2109DDC9B0d43063	B-sdBAL-STABLE - 0xDc2Df969EE5E662…f2 	100.00	8,600.52	100.00%	sdBAL	113.309	1,181	0.1373	BAL`;

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
  const crvIdProposal = "0xb99f49298447714103746ccd4370f57a300ed4f54925e961bf7d454c5d77b35c";
  const balIdProposal = "0xb4629bde9acfdda8618fb069f3da97606a1a0b11ae829de7b8a321fc540f16ee";
  const fraxIdProposal = "0x65794337b15e9a73016d52b297d070fd29d593ad7c9d7163e03fd312366066b4";
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