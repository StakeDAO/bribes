package interfaces

type Quest struct {
	RewardTokenAddress string `json:"rewardToken"`
	Gauge              string `json:"gauge"`
	Metadata           struct {
		InitialRewardsAmount float64 `json:"initialRewardsAmount"`
		Name                 string  `json:"name"`
		Symbol               string  `json:"symbol"`
		RewardTokenSymbol    string  `json:"rewardTokenSymbol"`
		RewardPerVoteValue   float64 `json:"rewardPerVoteValue"`
		Apr                  float64 `json:"apr"`
		ObjectiveVotes       float64 `json:"objectiveVotes"`
	} `json:"metadata"`
}
