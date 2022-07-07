package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"log"
	"main/interfaces"
	"net/http"
	"os"
	"time"

	"github.com/robfig/cron"
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered in main", r)
			main()
		}
	}()

	c := cron.New()
	c.AddFunc("@every 30m", collect)
	c.Start()

	collect()

	r := make(chan string)
	<-r
}

func collect() {
	defer func() {
		if r := recover(); r != nil {
			fmt.Println("Recovered in collect", r)
		}
	}()

	questResp, err := http.Get("http://localhost:3000/api/bribes/quest")
	if err != nil {
		log.Fatalln(err)
	}

	votiumResp, err := http.Get("http://localhost:3000/api/bribes/votium")
	if err != nil {
		log.Fatalln(err)
	}

	bodyQuest, err := ioutil.ReadAll(questResp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	bodyVotium, err := ioutil.ReadAll(votiumResp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	quests := make([]interfaces.Quest, 0)
	if err := json.Unmarshal(bodyQuest, &quests); err != nil {
		log.Fatalln(err)
	}

	votiums := make([]interfaces.Votium, 0)
	if err := json.Unmarshal(bodyVotium, &votiums); err != nil {
		log.Fatalln(err)
	}

	totalDollarRewardsPerGauge := make(map[string]float64, 0)
	totalVeCRVPerGauge := make(map[string]float64, 0)
	gaugeNames := make(map[string]string, 0)

	for _, quest := range quests {
		addIntoMap(totalDollarRewardsPerGauge, quest.Gauge, quest.Metadata.InitialRewardsAmount)
		addIntoMap(totalVeCRVPerGauge, quest.Gauge, quest.Metadata.ObjectiveVotes)
		gaugeNames[quest.Gauge] = quest.Metadata.Name
	}

	for _, votium := range votiums {
		addIntoMap(totalDollarRewardsPerGauge, votium.Gauge, votium.TotalAmountDollar)
		addIntoMap(totalVeCRVPerGauge, votium.Gauge, votium.VeCRVWithoutConvexFormat)
		gaugeNames[votium.Gauge] = votium.Name
	}

	// Calculate the dollar average for each gauge + globaldata
	// Calculate the round number
	round := 21

	results := make([]*interfaces.Result, 0)

	exists, _ := Exists("./tmp/result.json")
	if exists {
		file, _ := ioutil.ReadFile("./tmp/result.json")
		_ = json.Unmarshal([]byte(file), &results)
	}

	result := new(interfaces.Result)
	result.Round = int64(round)
	result.TotalDollar = 0
	result.TotalVeCRV = 0
	result.Gauges = make([]interfaces.Gauge, 0)
	result.Ts = time.Now().Unix()

	for gaugeAddress, totalDollarRewards := range totalDollarRewardsPerGauge {
		totalGaugeVeCRV := totalVeCRVPerGauge[gaugeAddress]

		result.TotalDollar += totalDollarRewards
		result.TotalVeCRV += totalGaugeVeCRV

		gauge := new(interfaces.Gauge)
		gauge.DollarAveragePerVeCRV = totalDollarRewards / totalGaugeVeCRV
		gauge.GaugeAddress = gaugeAddress
		gauge.Name = gaugeNames[gaugeAddress]
		gauge.TotalDollar = totalDollarRewards

		result.Gauges = append(result.Gauges, *gauge)
	}

	result.AverageDollarPerVeCRV = result.TotalDollar / result.TotalVeCRV

	fmt.Println(result)

	results = append(results, result)
	file, _ := json.MarshalIndent(results, "", " ")
	_ = ioutil.WriteFile("./tmp/result.json", file, 0644)
}

func addIntoMap(totalRewardsPerGauge map[string]float64, gauge string, amount float64) {
	if totalRewardsPerGauge[gauge] == 0 {
		totalRewardsPerGauge[gauge] = amount
	} else {
		totalRewardsPerGauge[gauge] += amount
	}
}

func Exists(name string) (bool, error) {
	_, err := os.Stat(name)
	if err == nil {
		return true, nil
	}
	if errors.Is(err, os.ErrNotExist) {
		return false, nil
	}
	return false, err
}
