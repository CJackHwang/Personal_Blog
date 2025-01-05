const toggleButton = document.getElementById('toggleButton');
const postList = document.getElementById('postList');
const introContent = document.getElementById('introContent');
const aboutContent = document.getElementById('aboutContent');
const contactContent = document.getElementById('contactContent');

// 根据用户偏好初始化主题
const setInitialTheme = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '&#9728;' : '&#9789'; // 太阳或月亮图标
};

setInitialTheme();

// 切换主题
toggleButton.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    toggleButton.style.backgroundColor = isDarkMode ? '#333' : '#f0f0f0';
    toggleButton.innerHTML = isDarkMode ? '&#9728;' : '&#9789';
    toggleButton.classList.add('rotate');
    setTimeout(() => toggleButton.classList.remove('rotate'), 600);
});

// 获取帖子文件列表
const fetchPostFiles = async () => {
    const response = await fetch('posts_list/list.txt');
    const text = await response.text();
    return text.split('\n').map(file => file.trim()).filter(Boolean); // 过滤掉空行
};

// 获取帖子内容
const fetchPost = async (file) => {
    const response = await fetch(`posts/${file}`);
    const data = await response.text();
    return parsePost(data);
};

// 解析帖子内容
const parsePost = (text) => {
    const lines = text.split('\n').map(line => line.trim());
    return { title: lines[0], meta: lines[1], content: lines.slice(2).join('\n').trim() };
};

// 渲染帖子
const renderPosts = (posts) => {
    postList.innerHTML = posts.map((post, index) => `
        <div class="post-card" onclick="toggleContent(${index})">
            <h2>${post.title}</h2>
            <p class="meta">${post.meta}</p>
            <p class="content" id="content-${index}" style="display: none; opacity: 0; max-height: 0; transition: max-height 0.5s ease, opacity 0.5s ease;" data-fulltext="${post.content}"></p>
        </div>
    `).join('');
};

let isAnimating = false; // 动画状态

// 切换帖子内容的可见性
const toggleContent = (index) => {
    const content = document.getElementById(`content-${index}`);
    const isVisible = content.style.maxHeight !== '0px';

    if (isAnimating) return;

    isAnimating = true;

    if (isVisible) {
        // 隐藏内容
        content.style.maxHeight = '0';
        content.style.opacity = '0';
        setTimeout(() => {
            content.style.display = 'none';
            isAnimating = false;
        }, 500);
    } else {
        // 显示内容
        content.style.display = 'block';
        const text = content.getAttribute('data-fulltext');
        content.textContent = '';
        let indexChar = 0;

        const interval = setInterval(() => {
            if (indexChar < text.length) {
                const nextChars = text.substr(indexChar, 40);
                content.textContent += nextChars;
                content.style.maxHeight = content.scrollHeight + 'px'; // 动态调整最大高度
                indexChar += 40;
            } else {
                clearInterval(interval);
                isAnimating = false;
            }
        }, 50);

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
        callback?.(); // 使用可选链
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
const setupNavigation = () => {
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
};

setupNavigation(); // 设置导航事件处理程序

// 初始化帖子
fetchPostFiles().then(postFiles => {
    Promise.all(postFiles.map(fetchPost)).then(renderPosts);
});
