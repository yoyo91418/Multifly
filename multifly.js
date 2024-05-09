//前端動態js
function scrollToContent(contentId) {
    var contentElement = document.getElementById(contentId);
    if (contentElement) {
        contentElement.scrollIntoView({ behavior: 'smooth' });
    }
}
document.querySelectorAll('#ALL, #category1, #category2, #category3, #category4, #category5, #category6, #category7, #category8, #category9, #category10, #category11').forEach(function (button) {
    // button.addEventListener('click', function () {
    //     // 获取需要淡入显示的元素
    //     // var butguide = document.querySelector('.butguide');
    //     var overlap4 = document.querySelector('.overlap-4');

    //     // 更改透明度以实现淡入效果
    //     // butguide.style.opacity = '1';
    //     overlap4.style.opacity = '1';

    //     // 确保元素是可见的（如果之前设置为display: none）
    //     // butguide.style.display = 'block';
    //     overlap4.style.display = 'block';
    // });
});

// 當文檔加載完成時
document.addEventListener('DOMContentLoaded', function () {
    // 綁定事件處理器

    // 获取new-content元素，并初始设置为不可见和不可交互
    var newContent = document.getElementById('new-content');
    newContent.style.opacity = '0';
    newContent.style.pointerEvents = 'none';

    var exploreButton = document.getElementById('explore-button');
    // 绑定点击事件处理器
    document.getElementById('explore-button').addEventListener("click", function () {
        // 获取按钮并隐藏
        var exploreButton = document.getElementById('explore-button');
        exploreButton.style.transition = 'opacity 2s ease-in-out';
        exploreButton.style.opacity = '0'; // 应用淡出效果

        // 获取并修改content区域的类
        var contentArea = document.getElementById('content-area');
        contentArea.addEventListener('click', function (event) {
            // 阻止事件冒泡
            event.stopPropagation();
            console.log("Clicked inside content area, but not triggering new-content effects.");
        });

        contentArea.classList.add('move-up');
        contentArea.classList.add('background-lock'); // 添加锁定背景图的类

        var elementsToFadeOut = document.querySelectorAll('#content-area .pre, #content-area .explore-button, #content-area .pre-comp, #content-area .pre-2, #content-area .text-wrapper-4, #content-area .flexcontainer');
        // 逐个元素应用淡出效果
        elementsToFadeOut.forEach(function (element) {
            element.style.transition = 'opacity 2s ease-in-out';
            element.style.opacity = '0';
        });


        // 延时以确保背景移动和淡出效果完成
        setTimeout(function () {
            // 隐藏已淡出的元素
            elementsToFadeOut.forEach(function (element) {
                element.style.display = 'none';
            });

            // 显示新内容
            newContent.style.opacity = '1';  // 设置透明度为 1 使其可见
            newContent.style.pointerEvents = 'auto';  // 允许交互
            newContent.classList.add('show');  // 添加 'show' 类，如果有定义相关样式

        }, 2000); // 这里的 2000 毫秒（2秒）是假设的动画时长，根据实际调整

        var canvasHolder = document.getElementById('canvasHolder');
        // var butGuide = document.querySelector('.butguide');

        // Display canvasHolder and ensure butGuide is clickable
        canvasHolder.style.display = 'block';
        // butGuide.style.pointerEvents = 'auto';

    });
    // canvasholder高度調整
    // 監聽顯示或隱藏 intro-textbox 的事件
    const introTextbox = document.querySelector('.intro-textbox');
    const canvasHolder = document.getElementById('canvasHolder');

    // 使用 MutationObserver 監聽 intro-textbox 的樣式變化
    const observer = new MutationObserver(function () {
        // 檢查 intro-textbox 是否被隱藏
        if (introTextbox.style.display === 'none' || !introTextbox.style.display) {
            canvasHolder.style.paddingTop = '50px';
        } else {
            canvasHolder.style.paddingTop = '0';
        }
    });

    observer.observe(introTextbox, { attributes: true, attributeFilter: ['style'] });

    // 初始檢查一次，以設置正確的 padding-top
    if (introTextbox.style.display === 'none' || !introTextbox.style.display) {
        canvasHolder.style.paddingTop = '50px';
    } else {
        canvasHolder.style.paddingTop = '0';
    }

    // 點擊蝴蝶前的提示視窗
    document.getElementById('explore-button').addEventListener('click', function () {
        // Assuming you have a button to trigger the overlay
        var overlay = document.getElementById('overlay');
        overlay.style.display = 'flex'; // Make overlay flex to enable it (important for centering content)
        setTimeout(function() { // Timeout to ensure the display change has taken effect before starting opacity transition
            overlay.style.opacity = 1; // Trigger fade-in
        }, 2000); // Short delay
    });
    
    document.getElementById('confirm-button').addEventListener('click', function () {
        // Assuming 'confirm-button' is used to hide the overlay
        var overlay = document.getElementById('overlay');
        overlay.style.opacity = 0; // Trigger fade-out
        setTimeout(function() {
            overlay.style.display = 'none'; // Fully hide overlay after transition
        }, 500); // Delay should match the transition time of the opacity
    });
    


});

