// src/App.js
import React from 'react';
import './App.css';
import SmsActivation from './SmsActivation';
import SmsBalance from './SmsBalance';

function App() {
    return (
        <div className="App">
            <h1 className="app-title">获取验证码</h1>
            <div className="app-container">
                <SmsBalance />
                <SmsActivation />
            </div>
        </div>
    );
}

export default App;
