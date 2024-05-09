document.addEventListener('DOMContentLoaded', (event) => {
    const logoRef = document.querySelector('.LOGO-ref');
    const linkHome = document.getElementById('link-home');
    const menuIcon = document.querySelector('.mobile-menu-icon');
    const mobileMenu = document.querySelector('.mobile-menu');
    const merchLinks = document.querySelectorAll('.merch');
    const collaborationLink = document.querySelector('.collaboration');
    const bannerOverlay = document.querySelector('.banneroverlay'); // 优化选择器，避免重复查询

    function fadeToHome() {
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    window.addEventListener('scroll', () => {
        const banner = document.querySelector('.banner');
        if (window.scrollY > 10) {
            banner.classList.add('scrolling-banner');
        } else {
            banner.classList.remove('scrolling-banner');
        }
    });

    function toggleMenu() {
        const isMenuOpen = mobileMenu.style.transform === 'translateX(0%)';
        mobileMenu.style.transform = isMenuOpen ? 'translateX(100%)' : 'translateX(0%)';
        menuIcon.src = isMenuOpen ? 'img/menu.png' : 'img/X.png';
        bannerOverlay.style.display = isMenuOpen ? 'none' : 'block'; // 控制遮罩显示与隐藏
    }

    function closeMenu() {
        if (mobileMenu.style.transform === 'translateX(0%)') {
            toggleMenu();
        }
        bannerOverlay.style.display = 'none'; // 确保遮罩隐藏
        document.querySelector('.banner').classList.remove('banner-active'); // 關閉菜單同時移除類別恢復banner顏色

    }

    logoRef.addEventListener('click', event => {
        event.preventDefault();
        fadeToHome();
    });

    linkHome.addEventListener('click', event => {
        event.preventDefault();
        fadeToHome();
    });

    menuIcon.addEventListener('click', event => {
        event.stopPropagation(); // 阻止事件冒泡到document
        toggleMenu();
    });

    // 只在点击非菜单元素时关闭菜单
    document.addEventListener('click', event => {
        if (!menuIcon.contains(event.target) && !mobileMenu.contains(event.target)) {
            closeMenu();
        }
    });

    document.addEventListener('keydown', event => {
        if (event.key === "Escape") {
            closeMenu();
        }
    });

    merchLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            window.open(link.href, '_blank');
        });
    });

    collaborationLink.addEventListener('click', event => {
        event.preventDefault();
        window.location.href = 'collaboration.html';
    });
    
});
