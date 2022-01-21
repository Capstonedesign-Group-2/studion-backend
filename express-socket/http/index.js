const axios = require('axios');

// axios 인스턴스 생성
const http = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    // headers: { "content-type": "application/json" }
});

const htp = {};

htp.setting = (accessToken) => {
    http.interceptors.request.use(
        function (config) {
    
            config.headers["Content-Type"] = "application/json; charset=utf-8";
            
            if (accessToken) {
                config.headers["Authorization"] = `Bearer ${accessToken}`;
            }
    
            return config;
        }, 
        function (error) {
            // 요청 에러 직전 호출됩니다.
            return Promise.reject(error);
        }
    );

    return http;
}


module.exports = htp;