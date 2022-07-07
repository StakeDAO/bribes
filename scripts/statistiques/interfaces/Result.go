package interfaces

type Result struct {
	Round                 int64   `json:"round"`
	TotalDollar           float64 `json:"totalDollar"`
	TotalVeCRV            float64 `json:"totalVeCRV"`
	AverageDollarPerVeCRV float64 `json:"averageDollarPerVeCRV"`
	Ts                    int64   `json:"ts"`
	Gauges                []Gauge `json:"gauges"`
}
