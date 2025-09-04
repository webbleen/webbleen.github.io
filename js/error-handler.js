// 全局错误处理器
(function() {
    'use strict';
    
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', function(event) {
        // 过滤掉AdSense相关的错误，这些通常是无害的
        if (event.reason && typeof event.reason === 'string') {
            if (event.reason.includes('runtime.lastError') || 
                event.reason.includes('MessageNotSentError') ||
                event.reason.includes('RegisterClientLocalizationsError')) {
                // 静默处理AdSense相关错误
                event.preventDefault();
                return;
            }
        }
        
        // 记录其他错误（可选）
        console.warn('Unhandled promise rejection:', event.reason);
    });
    
    // 捕获全局错误
    window.addEventListener('error', function(event) {
        // 过滤掉AdSense相关的错误
        if (event.message && (
            event.message.includes('runtime.lastError') ||
            event.message.includes('MessageNotSentError') ||
            event.message.includes('RegisterClientLocalizationsError') ||
            event.message.includes('postMessage')
        )) {
            // 静默处理AdSense相关错误
            event.preventDefault();
            return;
        }
        
        // 记录其他错误（可选）
        console.warn('Global error:', event.message);
    });
    
    // 重写console.error来过滤某些错误
    const originalConsoleError = console.error;
    console.error = function(...args) {
        const message = args.join(' ');
        
        // 过滤掉AdSense相关的错误
        if (message.includes('runtime.lastError') ||
            message.includes('MessageNotSentError') ||
            message.includes('RegisterClientLocalizationsError') ||
            message.includes('postMessage')) {
            // 静默处理，不输出到控制台
            return;
        }
        
        // 输出其他错误
        originalConsoleError.apply(console, args);
    };
    
    // 处理Chrome扩展相关的错误
    if (typeof chrome !== 'undefined' && chrome.runtime) {
        // 安全地处理Chrome扩展API
        try {
            if (chrome.runtime.onMessage) {
                chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                    // 安全地处理消息
                    try {
                        sendResponse({ success: true });
                    } catch (e) {
                        // 静默处理错误
                    }
                });
            }
        } catch (e) {
            // 静默处理Chrome扩展相关错误
        }
    }
    
    console.log('Error handler initialized successfully');
})();
