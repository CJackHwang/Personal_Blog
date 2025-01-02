const toggleButton = document.getElementById('toggleButton');
const postList = document.getElementById('postList');
const introContent = document.getElementById('introContent');
const aboutContent = document.getElementById('aboutContent');
const contactContent = document.getElementById('contactContent');

// 根据用户偏好初始化主题
const setInitialTheme = () => {
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '&#9728;' : '&#9789'; // 太阳或月亮图标
};

setInitialTheme();

// 点击按钮切换主题
toggleButton.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    toggleButton.style.backgroundColor = isDarkMode ? '#333333' : '#f0f0f0';
    toggleButton.innerHTML = isDarkMode ? '&#9728;' : '&#9789';
    toggleButton.classList.add('rotate');
    setTimeout(() => toggleButton.classList.remove('rotate'), 600);
});

// 帖子文件名称
const postFiles = ['博客公告栏.txt', '奖状生成器.txt', '中京东日.txt'];

// 获取帖子内容
const fetchPost = async (file) => {
    const response = await fetch(`posts/${file}`);
    const data = await response.text();
    return parsePost(data);
};

// 解析帖子内容
const parsePost = (text) => {
    const [title, meta, ...content] = text.split('\n').map(line => line.trim());
    return { title, meta, content: content.join('\n').trim() };
};

// 将帖子渲染到列表中
const renderPosts = (posts) => {
    postList.innerHTML = posts.map((post, index) => `
        <div class="post-card" onclick="toggleContent(${index})">
            <h2>${post.title}</h2>
            <p class="meta">${post.meta}</p>
            <p class="content" id="content-${index}" style="display: none; opacity: 0; max-height: 0; transition: max-height 0.5s ease, opacity 0.5s ease;" data-fulltext="${post.content}"></p>
        </div>
    `).join('');
};

// 动画状态
let isAnimating = false;

// 切换帖子内容的可见性
const toggleContent = (index) => {
    const content = document.getElementById(`content-${index}`);
    const isVisible = content.style.maxHeight !== '0px';

    if (isAnimating) return;

    isAnimating = true;

    if (isVisible) {
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        setTimeout(() => {
            content.style.display = 'none';
            isAnimating = false;
        }, 500);
    } else {
        content.style.display = 'block';
        const text = content.getAttribute('data-fulltext');
        content.textContent = '';
        let indexChar = 0;
        const charsPerInterval = 40; // 每次添加的字符数

        const interval = setInterval(() => {
            if (indexChar < text.length) {
                const nextChars = text.substr(indexChar, charsPerInterval);
                content.textContent += nextChars;
                content.style.maxHeight = content.scrollHeight + 'px'; // 动态调整最大高度
                indexChar += charsPerInterval; // 更新索引
            } else {
                clearInterval(interval);
                isAnimating = false;
            }
        }, 50); // 调整这个值控制速度

        setTimeout(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
            content.style.opacity = '1';
        }, 15);
    }
};

// 淡出效果
const fadeOut = (element, callback) => {
    element.style.opacity = '1';
    element.style.transition = 'opacity 0.5s ease';
    element.style.opacity = '0';
    setTimeout(() => {
        element.style.display = 'none';
        if (callback) callback();
    }, 150);
};

// 淡入效果
const fadeIn = (element) => {
    element.style.display = 'block';
    element.style.opacity = '0';
    element.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
        element.style.opacity = '1';
    }, 200);
};

// 导航事件处理程序
document.getElementById('aboutLink').addEventListener('click', (e) => {
    e.preventDefault();
    fadeOut(postList, () => {
        introContent.style.display = 'block';
        aboutContent.style.display = 'block';
        contactContent.style.display = 'none';
        fadeIn(introContent);
    });
});

document.getElementById('contactLink').addEventListener('click', (e) => {
    e.preventDefault();
    fadeOut(postList, () => {
        introContent.style.display = 'block';
        contactContent.style.display = 'block';
        aboutContent.style.display = 'none';
        fadeIn(introContent);
    });
});

document.getElementById('homeLink').addEventListener('click', (e) => {
    e.preventDefault();
    fadeOut(introContent, () => {
        postList.style.display = 'block';
        fadeIn(postList);
    });
});

// 初始化帖子
Promise.all(postFiles.map(fetchPost)).then(renderPosts);
