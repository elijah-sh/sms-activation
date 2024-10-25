// main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
)

// 表单数据结构
type FormData struct {
	Service      string `json:"service"`
	Country      string `json:"country"`
	Balance      string `json:"balance"`
	ActivationId int    `json:"activationId"`
	Status       int    `json:"status"`
	Error        string `json:"error"`
}

type StatusData struct {
	ActivationId string `json:"activationId"`
	StatusCode   string `json:"statusCode"`
}

// 定义响应结构体
type Response struct {
	Balance      string `json:"balance"`
	ActivationId string `json:"activationId"`
	Number       string `json:"number"`
	Error        string `json:"error,omitempty"`
	Body         string `json:"body"`
}

// 定义响应结构体
type ActiveActivations struct {
	ActivationId     string `json:"activationId"`
	ServiceCode      string `json:"serviceCode"`
	PhoneNumber      string `json:"phoneNumber"`
	ActivationCost   string `json:"activationCost"`
	ActivationStatus string `json:"activationStatus"`
	ActivationTime   string `json:"activationTime"`
	Discount         string `json:"discount"`
	Rrepeated        string `json:"repeated"`
	CountryCode      string `json:"countryCode"`
	CountryName      string `json:"countryName"`
	CanGetAnotherSms string `json:"canGetAnotherSms"`
	SmsCode          string `json:"smsCode"`
	SmsText          string `json:"smsText"`
}

type ActiveResponse struct {
	Status            string              `json:"status"`
	ActiveActivations []ActiveActivations `json:"activeActivations"`
}

// 处理余额请求
func balanceHandler(w http.ResponseWriter, r *http.Request) {

	// 设置 CORS 头部
	w.Header().Set("Access-Control-Allow-Origin", "*")                            // 允许特定来源
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")               // 允许的请求方法
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") // 允许的请求头
	// 允许跨域请求
	balance, err := getBalance()

	// 使用 Split 方法切割字符串
	parts := strings.Split(balance, ":")

	if len(parts) == 2 {
		balance = parts[1]
	} else {
		log.Panicf("字符串格式不正确 %s", balance)
	}
	response := Response{Balance: balance, Body: balance}
	if err != nil {
		response.Error = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// 获取手机号请求
func numberHandler(w http.ResponseWriter, r *http.Request) {
	// 设置 CORS 头部
	handlerHttpHeader(w, r)
	var formData FormData
	err := json.NewDecoder(r.Body).Decode(&formData)
	if err != nil {
		log.Default().Printf("numberHandler  numberHandler %s, %d", r.Body, http.StatusBadRequest)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	jsonData, err := getNumber(formData.Service, formData.Country)
	if err != nil {
		log.Print("response getNumber err: ", err)
		response := Response{Error: err.Error(), Body: jsonData}
		json.NewEncoder(w).Encode(response)
		return
	}

	// 异常代码处理
	if jsonData == "NO_BALANCE" {
		// NO_BALANCE - no money in the account
		response := Response{Error: "No money in the account  余额不足"}
		json.NewEncoder(w).Encode(response)
		return
	}
	if jsonData == "NO_NUMBERS" {
		response := Response{Error: "No numbers 没有号码"}
		json.NewEncoder(w).Encode(response)
		return
	}

	// 使用 Split 方法切割字符串
	parts := strings.Split(jsonData, ":")
	if len(parts) == 3 && strings.Contains(jsonData, "ACCESS_NUMBER") {
		response := Response{ActivationId: parts[1], Number: parts[2]}
		// 将对象转换为 JSON 字符串
		jsonData, err := json.Marshal(response)
		if err != nil {
			log.Default().Println("Error encoding JSON:", err, response)
			return
		}
		var responseData Response
		errorInfo := json.Unmarshal(jsonData, &responseData)
		if errorInfo != nil {
			log.Default().Println("Error unmarshalling JSON:", errorInfo, jsonData)
			return
		}
		log.Print("response unmarshalling JSON: ", responseData)
		json.NewEncoder(w).Encode(responseData)
	} else {
		log.Panicf("字符串格式不正确 %s", jsonData)
		response := Response{Body: jsonData}
		json.NewEncoder(w).Encode(response)
	}
	w.Header().Set("Content-Type", "application/json")
}

// 获取手机号请求
func setStatusHandler(w http.ResponseWriter, r *http.Request) {

	handlerHttpHeader(w, r)
	var statusData StatusData
	err := json.NewDecoder(r.Body).Decode(&statusData)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}
	// Convert StatusCode from string to int
	statusCode, err := strconv.Atoi(statusData.StatusCode)
	if err != nil {
		http.Error(w, "Invalid status code", http.StatusBadRequest)
		return
	}
	activationId, err := strconv.Atoi(statusData.ActivationId)
	if err != nil {
		http.Error(w, "Invalid activation ID", http.StatusBadRequest)
		return
	}
	jsonData, err := setStatus(statusCode, activationId)
	response := Response{Body: jsonData}
	if err != nil {
		response.Error = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// 获取短信
func getActiveActivationsHandler(w http.ResponseWriter, r *http.Request) {

	handlerHttpHeader(w, r)
	var statusData StatusData
	err := json.NewDecoder(r.Body).Decode(&statusData)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	jsonData, err := getActiveActivations()
	var activeResponse ActiveResponse
	jsonErr := json.Unmarshal([]byte(jsonData), &activeResponse)
	if jsonErr != nil {
		log.Fatalf("Error unmarshalling JSON: %v", err)
	}

	for _, activation := range activeResponse.ActiveActivations {
		// 匹配与当前号码有关的数据
		if statusData.ActivationId == activation.ActivationId {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(activation)
			return
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(nil)
}

func handlerHttpHeader(w http.ResponseWriter, r *http.Request) {
	// 处理 CORS 预检请求
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Origin", "*") // 允许所有来源
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.WriteHeader(http.StatusNoContent)
		return
	}

	// 允许实际请求的 CORS 头
	w.Header().Set("Access-Control-Allow-Origin", "*") // 允许所有来源（或指定前端的 URL）
	w.Header().Set("Content-Type", "application/json")

}

// 配置日志
// func configureLog() {

// }

// 处理余额请求
func resetActivationNumberHandler(w http.ResponseWriter, r *http.Request) {
	handlerHttpHeader(w, r)
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization") // 允许的请求头
	// 允许跨域请求
	jsonData, err := getActiveActivations()
	var activeResponse ActiveResponse
	jsonErr := json.Unmarshal([]byte(jsonData), &activeResponse)
	if jsonErr != nil {
		log.Fatalf("Error unmarshalling JSON: %v", err)
	}
	var count int = 0
	for _, activation := range activeResponse.ActiveActivations {
		// 匹配与当前号码有关的数据
		if activation.SmsCode == "" && activation.ActivationId != "" {
			// 调用 setStatus 函数重置短信验证码状态
			activationId, err := strconv.Atoi(activation.ActivationId)
			if err != nil {
				http.Error(w, "Invalid activation ID", http.StatusBadRequest)
				return
			}
			jsonData, err := setStatus(8, activationId)
			if err != nil {
				// 处理错误情况，例如记录日志
				log.Printf("Failed to reset status for Activation ID %s: %v", activation.ActivationId, err)
			} else {
				log.Printf("Reset status for Activation ID %s: %s", activation.ActivationId, jsonData)
				if jsonData == "ACCESS_CANCEL" {
					count += 1
				}
			}
		}
	}

	response := Response{Body: "累计重置短信验证码数量: " + strconv.Itoa(count)}
	if err != nil {
		response.Error = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {

	// configureLog()
	currentDate := time.Now().Format("2006-01-02")
	// 创建或打开 log 目录
	logDir := "log"
	if _, err := os.Stat(logDir); os.IsNotExist(err) {
		err := os.Mkdir(logDir, 0755)
		if err != nil {
			log.Fatalf("Failed to create log directory: %v", err)
		}
	}
	// 设置日志文件路径
	logFileName := fmt.Sprintf("%s/app_%s.log", logDir, currentDate)
	// 打开或创建日志文件
	logFile, err := os.OpenFile(logFileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Failed to open log file: %v", err)
	}
	defer logFile.Close()
	// 设置日志的输出到文件
	log.SetOutput(logFile)
	http.HandleFunc("/getBalance", balanceHandler)
	http.HandleFunc("/resetActivationNumber", resetActivationNumberHandler)
	http.HandleFunc("/getNumber", numberHandler)
	http.HandleFunc("/setStatus", setStatusHandler)
	http.HandleFunc("/getActiveActivations", getActiveActivationsHandler)
	http.ListenAndServe(":8080", nil)

}
