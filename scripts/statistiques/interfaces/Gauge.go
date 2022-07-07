package interfaces

type Gauge struct {
	Name                  string  `json:"name"`
	GaugeAddress          string  `json:"address"`
	DollarAveragePerVeCRV float64 `json:"dollarAveragePerVeCRV"`
	TotalDollar           float64 `json:"totalDollar"`
}
