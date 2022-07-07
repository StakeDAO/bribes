package interfaces

type Votium struct {
	Name                     string  `json:"name"`
	Symbol                   string  `json:"symbol"`
	RewardTokenSymbol        string  `json:"rewardTokenSymbol"`
	RewardTokenAddress       string  `json:"token"`
	RewardPerVoteValue       float64 `json:"rewardPerVoteValue"`
	TotalReward              float64 `json:"totalReward"`
	TotalAmountDollar        float64 `json:"totalAmountDollar"`
	VeCRVWithoutConvexFormat float64 `json:"veCRVWithoutConvexFormat"`
	Apr                      float64 `json:"apr"`
	Gauge                    string  `json:"gauge"`
}
