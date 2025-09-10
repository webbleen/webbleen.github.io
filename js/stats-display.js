/**
 * 统计数据显示脚本
 * 用于在统计页面动态加载和显示访问统计数据
 */

(function() {
    'use strict';
    
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
        // 默认语言为中文（包括 /stats/ 路径）
        return 'zh-cn';
    }

    // 动态获取访问统计数据
    function loadStatsData() {
        // 获取当前页面语言
        const language = getCurrentLanguage();
        // console.log('Loading stats for language:', language);
        
        // 构建 API URL
        const apiUrl = `https://api.webbleen.com/stats/visits?language=${language}`;
        // console.log('API URL:', apiUrl);
        
        // 发送请求
        fetch(apiUrl)
            .then(response => {
                // console.log('API response status:', response.status);
                return response.json();
            })
            .then(data => {
                // console.log('Stats data received:', data);
                if (data.code === 200 && data.data) {
                    // 更新页面显示
                    updateStatsDisplay(data.data);
                } else {
                    console.error('Failed to get stats:', data.msg);
                    showError('获取统计数据失败');
                }
            })
            .catch(error => {
                console.error('Error fetching stats:', error);
                showError('网络请求失败');
            });
    }
    
    // 更新统计数据显示
    function updateStatsDisplay(data) {
        // 更新今日访问量
        const todayVisitsElement = document.getElementById('today-visits');
        if (todayVisitsElement) {
            todayVisitsElement.textContent = data.today_visits || 0;
        }
        
        // 更新总访问量
        const totalVisitsElement = document.getElementById('total-visits');
        if (totalVisitsElement) {
            totalVisitsElement.textContent = data.total_visits || 0;
        }
        
        // 更新今日独立访客（如果有的话）
        const uniqueVisitorsElement = document.getElementById('unique-visitors-today');
        if (uniqueVisitorsElement) {
            uniqueVisitorsElement.textContent = data.unique_visitors_today || 0;
        }
        
        // console.log('Stats display updated successfully');
    }
    
    // 显示错误信息
    function showError(message) {
        console.error('Stats error:', message);
        // 可以选择在页面上显示错误信息
        const errorElement = document.getElementById('stats-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }
    
    // 页面加载完成后执行
    document.addEventListener('DOMContentLoaded', function() {
        // 检查是否在统计页面
        if (window.location.pathname.includes('/stats/')) {
            // console.log('Stats page detected, loading data...');
            loadStatsData();
        }
    });
    
    // 暴露全局函数供外部调用
    window.WebbleenStatsDisplay = {
        loadStatsData: loadStatsData,
        updateStatsDisplay: updateStatsDisplay
    };
    
})();
