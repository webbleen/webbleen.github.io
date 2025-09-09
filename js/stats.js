/**
 * Webbleen 博客统计脚本
 * 用于在 Hugo 博客中集成访问统计功能
 */

(function() {
    'use strict';
    
    // 全局配置
    let CONFIG = {};
    
    // 加载配置
    async function loadConfig() {
        // 直接使用默认配置，避免网络请求失败
        CONFIG = {
            api: {
                baseUrl: 'https://api.webbleen.com',
                endpoints: {
                    visit: '/stats/visit',
                    visits: '/stats/visits',
                    pages: '/stats/pages',
                    trend: '/stats/trend',
                    behavior: '/stats/behavior',
                    daily: '/stats/daily'
                }
            },
            session: {
                key: 'webbleen_session_id',
                visitKey: 'webbleen_visit_recorded'
            }
        };
        console.log('Config loaded:', CONFIG);
    }
    
    // 获取或生成会话ID
    function getSessionId() {
        // 如果配置未加载，使用默认的会话键
        const sessionKey = (CONFIG && CONFIG.session) ? CONFIG.session.key : 'webbleen_session_id';
        
        let sessionId = localStorage.getItem(sessionKey);
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(sessionKey, sessionId);
        }
        return sessionId;
    }
    
    // 检测设备类型
    function getDeviceType() {
        const userAgent = navigator.userAgent;
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return 'mobile';
        } else if (/Tablet|iPad/.test(userAgent)) {
            return 'tablet';
        } else {
            return 'desktop';
        }
    }
    
    // 检测浏览器
    function getBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Chrome') > -1) return 'Chrome';
        if (userAgent.indexOf('Firefox') > -1) return 'Firefox';
        if (userAgent.indexOf('Safari') > -1) return 'Safari';
        if (userAgent.indexOf('Edge') > -1) return 'Edge';
        if (userAgent.indexOf('Opera') > -1) return 'Opera';
        return 'Unknown';
    }
    
    // 检测操作系统
    function getOS() {
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Windows') > -1) return 'Windows';
        if (userAgent.indexOf('Mac') > -1) return 'macOS';
        if (userAgent.indexOf('Linux') > -1) return 'Linux';
        if (userAgent.indexOf('Android') > -1) return 'Android';
        if (userAgent.indexOf('iOS') > -1) return 'iOS';
        return 'Unknown';
    }
    
    // 获取地理位置信息（通过IP API，带缓存）
    async function getLocation() {
        const CACHE_KEY = 'webbleen_location_cache';
        const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存
        
        // 检查缓存
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const cacheData = JSON.parse(cached);
                const now = Date.now();
                
                // 检查缓存是否过期
                if (now - cacheData.timestamp < CACHE_DURATION) {
                    console.log('Using cached location data');
                    return cacheData.location;
                } else {
                    console.log('Location cache expired, fetching new data');
                    localStorage.removeItem(CACHE_KEY);
                }
            } catch (error) {
                console.warn('Failed to parse cached location data:', error);
                localStorage.removeItem(CACHE_KEY);
            }
        }
        
        try {
            console.log('Fetching location data from ipapi.co');
            // 使用免费的IP地理位置API
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            const location = {
                country: data.country_name || 'Unknown',
                city: data.city || 'Unknown',
                ip: data.ip || 'Unknown'
            };
            
            // 缓存数据
            const cacheData = {
                timestamp: Date.now(),
                location: location
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log('Location data cached for 30 minutes');
            
            return location;
        } catch (error) {
            console.warn('Failed to get location info:', error);
            return {
                country: 'Unknown',
                city: 'Unknown',
                ip: 'Unknown'
            };
        }
    }
    
    // 获取当前页面语言
    function getCurrentLanguage() {
        const path = window.location.pathname;
        if (path.startsWith('/ja/')) {
            return 'ja';
        } else if (path.startsWith('/zh-cn/')) {
            return 'zh-cn';
        } else if (path.startsWith('/en/')) {
            return 'en';
        }
        // 默认语言为中文
        return 'zh-cn';
    }
    
    // 记录访问
    async function recordVisit() {
        console.log('recordVisit called');
        
        // 检查配置是否已加载
        if (!CONFIG || !CONFIG.session || !CONFIG.api) {
            console.log('Config not ready, skipping visit record');
            return;
        }
        
        // 检查是否已经记录过本次访问
        const visitKey = CONFIG.session.visitKey + '_' + window.location.pathname;
        if (sessionStorage.getItem(visitKey)) {
            console.log('Visit already recorded for this page');
            return;
        }
        
        // 获取当前页面语言
        const language = getCurrentLanguage();
        console.log('Detected language:', language);
        
        // 异步获取地理位置信息
        const location = await getLocation();
        console.log('Location info:', location);
        
        const visitData = {
            page: window.location.pathname,
            session_id: getSessionId(),
            device: getDeviceType(),
            browser: getBrowser(),
            os: getOS(),
            country: location.country,
            city: location.city,
            ip: location.ip,
            language: language
        };
        
        console.log('Sending visit data:', visitData);
        
        // 发送统计数据
        try {
            const response = await fetch(CONFIG.api.baseUrl + CONFIG.api.endpoints.visit, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(visitData)
            });
            
            console.log('API response status:', response.status);
            if (response.ok) {
                // 标记已记录
                sessionStorage.setItem(visitKey, 'true');
                console.log('Visit recorded successfully');
            } else {
                console.error('Failed to record visit:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error recording visit:', error);
        }
    }
    
    // 获取统计数据
    function getStats(language = null) {
        if (!CONFIG.api || !CONFIG.api.baseUrl) {
            console.error('Config not loaded yet');
            return Promise.reject(new Error('Config not loaded'));
        }
        
        let url = CONFIG.api.baseUrl + CONFIG.api.endpoints.visits;
        if (language) {
            url += `?language=${encodeURIComponent(language)}`;
        }
        
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    return data.data;
                }
                throw new Error(data.msg);
            });
    }
    
    // 获取内容统计
    function getContentStats(language = null) {
        if (!CONFIG.api || !CONFIG.api.baseUrl) {
            console.error('Config not loaded yet');
            return Promise.reject(new Error('Config not loaded'));
        }
        
        let url = CONFIG.api.baseUrl + CONFIG.api.endpoints.content;
        if (language) {
            url += `?language=${encodeURIComponent(language)}`;
        }
        
        return fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.code === 200) {
                    return data.data;
                }
                throw new Error(data.msg);
            });
    }
    
    // 更新内容统计（用于同步Hugo博客的内容）
    function updateContentStats(articles, tags, categories) {
        if (!CONFIG.api || !CONFIG.api.baseUrl) {
            console.error('Config not loaded yet');
            return Promise.reject(new Error('Config not loaded'));
        }
        const formData = new FormData();
        formData.append('articles', articles);
        formData.append('tags', tags);
        formData.append('categories', categories);
        
        return fetch(CONFIG.api.baseUrl + CONFIG.api.endpoints.content, {
            method: 'POST',
            body: formData
        }).then(response => response.json())
        .then(data => {
            if (data.code === 200) {
                console.log('Content stats updated successfully');
                return data.data;
            }
            throw new Error(data.msg);
        });
    }
    
    // 初始化函数
    async function init() {
        await loadConfig();
        
        // 页面加载完成后记录访问
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', recordVisit);
        } else {
            recordVisit();
        }
        
        // 页面卸载时记录停留时间
        window.addEventListener('beforeunload', function() {
            const startTime = performance.timing.navigationStart;
            const endTime = Date.now();
            const stayTime = Math.round((endTime - startTime) / 1000);
            
            // 可以发送停留时间数据
            fetch(CONFIG.api.baseUrl + CONFIG.api.endpoints.visit, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page: window.location.pathname,
                    session_id: getSessionId(),
                    stay_time: stayTime
                })
            }).catch(error => {
                console.error('Error recording stay time:', error);
            });
        });
    }
    
    // 暴露全局API
    window.WebbleenStats = {
        recordVisit: recordVisit,
        getStats: getStats,
        getContentStats: getContentStats,
        updateContentStats: updateContentStats,
        getSessionId: getSessionId,
        init: init
    };
    
    // 启动初始化
    init();
    
})();
