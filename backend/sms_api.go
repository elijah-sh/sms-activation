package main

import (
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
)

type Page struct {
	Title string
	Body  []byte
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

type Config struct {
	ApiKey           string `json:"apiKey"`
	SmsActivationUrl string `json:"smsActivationUrl"`
}

func loadConfig(filename string) (Config, error) {
	var config Config
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return config, err
	}
	err = json.Unmarshal(data, &config)
	return config, err
}

func getBalance() (string, error) {

	config, err := loadConfig("config.json")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}
	action := "getBalance"
	url := fmt.Sprintf("%s?api_key=%s&action=%s", config.SmsActivationUrl, config.ApiKey, action)
	balance, err := getSMS(url) // 处理错误
	if err != nil {
		return "", fmt.Errorf("error fetching balance: %w", err) // Wrap error for more context
	}
	return balance, nil // 返回余额
}

func getNumber(service string, country string) (string, error) {

	config, err := loadConfig("config.json")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}
	action := "getNumber"
	url := fmt.Sprintf("%s?api_key=%s&action=%s&service=%s&country=%s", config.SmsActivationUrl, config.ApiKey, action, service, country)
	jsonData, err := getSMS(url)
	if err != nil {
		return "", err // 返回错误
	}
	return jsonData, nil

}

func getActiveActivations() (string, error) {
	config, err := loadConfig("config.json")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}
	action := "getActiveActivations"
	url := fmt.Sprintf("%s?api_key=%s&action=%s", config.SmsActivationUrl, config.ApiKey, action)

	jsonData, err := getSMS(url)
	if err != nil {
		return "", err // 返回错误
	}
	return jsonData, nil
}

func setStatus(status int, activationId int) (string, error) {
	config, err := loadConfig("config.json")
	if err != nil {
		log.Fatalf("Error loading config: %v", err)
	}
	action := "setStatus"
	parameters := fmt.Sprintf("&status=%d&id=%d", status, activationId)
	url := fmt.Sprintf("%s?api_key=%s&action=%s&%s", config.SmsActivationUrl, config.ApiKey, action, parameters)
	jsonData, err := getSMS(url)
	if err != nil {
		return "", err // 返回错误
	}
	return jsonData, nil
}

func getSMS(url string) (string, error) {
	// 发送 GET 请求
	log.Default().Println("Http Get: ", url)
	resp, err := http.Get(url)
	if err != nil {
		log.Default().Println("Error sending GET request:", err)
		return "", fmt.Errorf("error sending GET request: %w", err)
	}
	defer resp.Body.Close()

	// 读取响应
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Default().Println("Error reading response body:", err)
		return "", fmt.Errorf("error sending GET request: %w", err)
	}
	// 打印响应
	log.Default().Printf("Response: %s, %s", resp.Status, string(body))
	if resp.StatusCode == http.StatusOK {
		return string(body), nil
	}
	return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)
}
