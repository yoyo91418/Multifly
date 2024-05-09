document.addEventListener("DOMContentLoaded", function () {
    // 當文檔加載完成時，為所有連結添加點擊事件處理
    document.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var targetUrl = this.getAttribute('href');
            if (!targetUrl.startsWith('#')) { // 忽略錨點連結
                e.preventDefault(); // 阻止連結的默認動作
                document.body.classList.remove('fade-in');
                document.body.classList.add('fade-out');
                // 延遲頁面跳轉以顯示淡出效果
                setTimeout(function () {
                    window.location = targetUrl;
                }, 500); // 淡出動畫的持續時間
            }
        });
    });
});
