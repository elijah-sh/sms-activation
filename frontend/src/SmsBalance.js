import React, { useState } from 'react';

function Sms() {
    const [balance, setBalance] = useState('');
    const [error, setError] = useState('');
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const [smsMessage, setSmsMessage] = useState(''); 

    const fetchBalance = async () => {
        try {
            setBalance('');
            const response = await fetch(API_BASE_URL + '/getBalance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();

            if (data.error) {
                setError(data.error);
                setBalance('');
            } else {
                setBalance(data.balance);
                setError('');
            }
        } catch (err) {
            setError('网络错误: ' + err.message);
            setBalance('');
        }
    };

    const resetActivationNumber = async () => {
        try {
            setSmsMessage(null)

            const response = await fetch(API_BASE_URL + '/resetActivationNumber', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const data = await response.json();
            if (data.error) {
                setError(data.error);
            } else {
                setSmsMessage(data.body)
            }
        } catch (err) {
            setError('网络错误: ' + err.message);
            setBalance('');
        }
    };

    return (
        <div>
            <div className="button-container">
                <button className="button" onClick={fetchBalance}>查询余额</button>
                <button className="button" onClick={resetActivationNumber}>重置激活号码</button>
            </div>
            <br></br>
            {error && <div style={{ color: 'red' }}>错误: {error}</div>}
            {balance && <div>余额: {balance}</div>}
            {smsMessage && <div>{smsMessage}</div>}
            <br></br>
        </div>
    );
}

export default Sms;
