// src/SmsActivation.js
import React, { useEffect, useState } from 'react';

import './index.css'; // 确保引入 CSS
// 创建一个国家常量数据的 JSON 文件路径
const serviceJsonPath = '/service.json';
const countryJsonPath = '/country.json';

const SmsActivation = () => {

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const [activationId, setActivationId] = useState('');
    const [number, setNumber] = useState('');
    const [error, setError] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [verificationCode, setVerificationCode] = useState(''); // 用于存储验证码
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(''); // 状态信息

    const [countries, setCountries] = useState({});
    const [serviceList, setServiceList] = useState({});
    const [activeCountryName, setActiveCountryName] = useState('');
    const [activeServiceName, setActiveServiceName] = useState('');
    const [activePhoneNumber, setActivePhoneNumber] = useState('');
    const [activeSmsCode, setActiveSmsCode] = useState('');
    const [activeSmsText, setActiveSmsText] = useState('');
    const [activeTime, setActiveTime] = useState('');
    const [activeErrorMessage, setActiveErrorMessage] = useState('');

    const [selectedService, setSelectedService] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('');

    useEffect(() => {
        // 读取 JSON 文件并设置国家数据
        fetch(serviceJsonPath)
            .then((response) => response.json())
            .then((data) => setServiceList(data))
            .catch((error) => console.error('Error fetching the serviceList JSON:', error));
        fetch(countryJsonPath)
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error('Error fetching the setCountries JSON:', error));
    }, []);

    // 处理下拉框选项变化的函数 选择服务
    const handleSelectServiceChange = (event) => {
        setSelectedService(event.target.value);
    };
    const handleSelectCountryChange = (event) => {
        setSelectedCountry(event.target.value);
    };


    // 通过键取值的函数
    const getServiceByKey = (key) => {
        return serviceList[key] || 'Service not found';
    };

    // 样式
    const buttonStyle = {
        padding: '10px 20px',
        fontSize: '16px',
        cursor: 'pointer',
        height: '40px', // 确保高度一致
        border: 'none',
        borderRadius: '4px',
    };

    // 点击“免费获取下一条短信”的处理函数
    const handleGetNextMessage = () => {
        setState(activationId, "3")
    };

    // 点击“完成接收”的处理函数
    const handleCompleteReception = () => {
        setState(activationId, "6")
    };

    // 点击“取消接收”的处理函数
    const handleCancelReception = () => {
        setState(activationId, "8")
    };

    // 点击“查询验证码”的处理函数
    const handleQueryVerificationCode = () => {
        getActiveActivations(activationId);
    };

    const setState = async (activationId, statusCode) => {
        // Status code:
        // 3 - 免费获取下一条短信
        // 6 - 完成接收
        // 8 - 取消接收
        setStatusMessage(null);
        const response = await fetch(API_BASE_URL + '/setStatus', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "activationId": activationId, "statusCode": statusCode }),
        });

        if (response.ok) {
            const json = await response.json();
            // 解析 JSON 字符串
            // const json = JSON.parse(data);

            if (json.error) {
                setError(json.error);
                setErrorMessage(json.message);
            } else {
                setStatusMessage(json.body);
                setErrorMessage("");;
                if (json.body === "ACCESS_CANCEL") {
                    setStatusMessage("activation canceled.  您取消了获取短信");
                }
                if (json.body === "BAD_STATUS") {
                    setStatusMessage("incorrect status 错误的状态");
                }
                if (json.body === "EARLY_CANCEL_DENIED") {
                    setStatusMessage("You cannot cancel mail for the first 2 minutes. 您不能取消获取短信在2分钟内。");
                }
                if (json.body === "ACCESS_RETRY_GET") {
                    setStatusMessage("Waiting for a new SMS.  等待获取新的短信。");
                }
                if (json.body === "ACCESS_ACTIVATION") {
                    setStatusMessage("The service has been successfully activated.   服务已成功激活。");
                }
            }
            return json;
        } else {
            alert('Error submitting form');
        }

    };

    const getActiveActivations = async (activationId) => {
        setVerificationCode(null);
        setActiveErrorMessage(null);
        const response = await fetch(API_BASE_URL + '/getActiveActivations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "activationId": activationId }),
        });

        if (!response.ok) {
            alert('Error getActiveActivations form');
            return;
        }
        const data = await response.json();
        // 解析 JSON 字符串
        // const json = JSON.parse(data);
        if (data == null) {
            setActiveErrorMessage("未找到激活信息");
            return;
        }
        if (data.error) {
            setActiveErrorMessage(data.message);
            return;
        }
        const serviceName = getServiceByKey(data.serviceCode);
        const cleanedSmsText = data.smsText.replace(/\n/g, '');
        const smsText = cleanedSmsText ? cleanedSmsText : "未收到短信";
        const smsCode = data.smsCode ? data.smsCode : "未收到验证码";
        const str = `您选择的
                服务: ${serviceName}, 国家: ${data.countryName},
                手机号码: ${data.phoneNumber}, 验证码: ${smsCode},
                短信内容: ${smsText}`;
        setVerificationCode(str);
        setActiveServiceName(serviceName);
        setActiveCountryName(data.countryName);
        setActivePhoneNumber(data.phoneNumber);
        setActiveSmsCode(data.smsCode);
        setActiveSmsText(data.smsText);
        setActiveTime(data.activationTime);

        // setIsCancelDisabled(true); // 禁用“取消接收”按钮

    };

    // 激活号码
    const handleSubmit = async (event) => {
        setIsLoading(true); // 开始请求时设置加载状态为 true
        setError(null);
        setErrorMessage(null);
        setNumber(null);
        setActivationId(null);
        setStatusMessage(null);
        setVerificationCode(null);
        setActiveErrorMessage(null);
        event.preventDefault();
        const response = await fetch(API_BASE_URL + '/getNumber', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "service": selectedService, "country": selectedCountry }),
        });

        if (!response.ok) {
            setIsLoading(false); // 请求结束后设置加载状态为 false
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();

        if (json.error) {
            setError(json.error);
            setErrorMessage(json.message);
            setNumber('');
        } else {
            setNumber(json.number);
            setActivationId(json.activationId);
            setError('');
            if(json.number === "" || json.activationId === ""){
                // BAD_SERVICE - incorrect service name
                if(json.body === "BAD_SERVICE"){
                    setError('BAD_SERVICE');
                    setErrorMessage("incorrect service name 错误的服务名称");
                }
            }
        }
        setIsLoading(false); // 请求结束后设置加载状态为 false
    };

    return (
        <div className="form-container">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="service-select">选择服务: </label>
                    <select
                        id="service-select"
                        value={selectedService}
                        onChange={handleSelectServiceChange}
                        style={{ marginBottom: '10px', padding: '5px' }}
                        required
                    >
                        <option value="">请选择服务</option>
                        {Object.entries(serviceList).map(([key, value]) => (
                            <option key={key} value={key}>
                                {value}
                            </option>
                        ))}
                    </select>
                    {selectedService && (
                        <div style={{ marginTop: '10px' }}>
                            {/* 您选择的服务是: {serviceList[selectedService]} */}
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="service-select">选择服务: </label>
                    <select
                        id="service-select"
                        value={selectedCountry || "0"}
                        onChange={handleSelectCountryChange}
                        style={{ marginBottom: '10px', padding: '5px' }}
                    >
                        <option value="">选择国家:</option>
                        {Object.entries(countries).map(([key, value]) => (
                            <option key={key} value={key}>
                                {value}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <button type="submit" className="button" disabled={isLoading}>
                        {isLoading ? '加载中...' : '激活号码'}
                    </button>
                </div>
            </form>
            <div>
                {/* <br></br> */}
                {/* <h3>获取号码结果</h3> */}
                {error && <div style={{ color: 'red' }}>错误代码: {error}</div>}
                {errorMessage && <div style={{ color: 'red' }}>错误信息: {errorMessage}</div>}
                {number && (
                    <>
                        <div className='activated-number'>已激活手机号: {number}</div>
                        <div style={{ width: '300px', margin: '0 auto' }} >

                            {/* 按钮组 1: 查询验证码、免费获取下一条短信、完成接收、取消接收 */}
                            {/* 按钮组 获取短信 1: 查询验证码 */}
                            <div className="button-group" style={{ marginBottom: '40px' }}>
                                <button className="button" style={{ ...buttonStyle, width: '100%' }} onClick={handleQueryVerificationCode}>
                                    获取短信
                                </button>
                            </div>
                            {/* 显示验证码 短信内容*/}
                            {activeErrorMessage && <div style={{ color: 'red' }}>错误信息: {activeErrorMessage}</div>}
                            {verificationCode && (
                                <div className='verification-code' style={{ marginTop: '10px' }}>
                                    <table style={{ borderCollapse: 'collapse', width: '100%', textAlign: 'left' }}>
                                        <tbody>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>服务</th>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{activeServiceName}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>国家</th>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{activeCountryName}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>手机号码</th>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{activePhoneNumber}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>激活时间</th>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{activeTime}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>验证码</th>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{activeSmsCode}</td>
                                            </tr>
                                            <tr>
                                                <th style={{ border: '1px solid #ddd', padding: '8px' }}>短信内容</th>
                                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{activeSmsText}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 按钮组 2: 免费获取下一条短信、完成接收、取消接收 */}
                            <div className="button-group"
                                style={{ display: 'flex', justifyContent: 'space-between', gap: '5px' }}

                            >
                                <button className="button" onClick={handleGetNextMessage}
                                    style={{ ...buttonStyle, flex: '1' }}

                                >
                                    免费获取下一条短信
                                </button>
                                <button className="button" onClick={handleCompleteReception}
                                    style={{ ...buttonStyle, flex: '1' }}
                                >
                                    完成接收
                                </button>
                                <button className="button.cancel" onClick={handleCancelReception}
                                    // disabled={isCancelDisabled}
                                    style={{ ...buttonStyle, flex: '1' }}
                                >
                                    取消接收
                                </button>
                            </div>

                            {/* 显示提示信息 */}
                            {statusMessage && (
                                <div className='activated-number' style={{ marginTop: '10px' }}>
                                    {statusMessage}
                                </div>
                            )}
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default SmsActivation;
