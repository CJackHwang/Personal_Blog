const toggleButton = document.getElementById('toggleButton');
const postList = document.getElementById('postList');
const introContent = document.getElementById('introContent');
const aboutContent = document.getElementById('aboutContent');
const contactContent = document.getElementById('contactContent');

// 根据用户偏好初始化主题
const setInitialTheme = () => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', isDarkMode);
    toggleButton.innerHTML = isDarkMode ? '&#9728;': '&#9789;';
};

setInitialTheme();

// 切换主题
toggleButton.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    toggleButton.style.backgroundColor = isDarkMode ? '#333': '#f0f0f0';
    toggleButton.innerHTML = isDarkMode ? '&#9728;': '&#9789;';
    toggleButton.classList.add('rotate');
    setTimeout(() => toggleButton.classList.remove('rotate'), 600);
});

// 获取帖子文件列表
const getPostFileList = async () => {
    try {
        const response = await fetch('posts_list/list.txt');
        const text = await response.text();
        return text.split('\n').map(file => file.trim()).filter(Boolean);
    } catch (error) {
        console.error('Failed to fetch post files:', error);
        return [];
    }
};

// 获取帖子内容
const fetchPost = async (file) => {
    try {
        const response = await fetch(`posts/${file}`);
        const data = await response.text();
        return parsePost(data);
    } catch (error) {
        console.error(`Failed to fetch post: ${file}`, error);
        return null; // 返回 null 以处理不完整的帖子
    }
};

// 解析帖子内容
const parsePost = (text) => {
    const lines = text.split('\n').map(line => line.trim());
    const [title,
        meta,
        ...contentLines] = lines;
    return {
        title,
        meta,
        content: `<div class="footer-links">${marked.parse(contentLines.join('\n').trim())}</div>`
    };
};

// 批量渲染帖子
const displayPosts = (posts) => {
    const fragment = document.createDocumentFragment();
    posts.forEach((post, index) => {
        if (post) {
            const postCard = document.createElement('div');
            postCard.className = 'post-card';
            postCard.onclick = () => toggleContent(index);
            postCard.innerHTML = `
            <h2>${post.title}</h2>
            <p class="meta">${post.meta}</p>
            <div class="content" id="content-${index}" style="display: none; opacity: 0; max-height: 0; transition: max-height 0.5s ease, opacity 0.5s ease;" data-fulltext="${encodeURIComponent(post.content)}"></div>
            `;
            fragment.appendChild(postCard);
        }
    });
    postList.appendChild(fragment);
};

let isAnimating = false;

// 通用的内容切换函数
const toggleContent = (index) => {
    const content = document.getElementById(`content-${index}`);
    const isVisible = content.style.maxHeight !== '0px';

    if (isAnimating) return;

    isAnimating = true;

    const toggleAnimation = (show) => {
        if (show) {
            content.style.display = 'block';
            const text = decodeURIComponent(content.getAttribute('data-fulltext'));
            content.innerHTML = text;

            // 等待图片加载完成
            const images = content.getElementsByTagName('img');
            let loadedImages = 0;

            const checkImagesLoaded = () => {
                loadedImages++;
                if (loadedImages === images.length) {
                    content.style.maxHeight = content.scrollHeight + 'px';
                    content.style.opacity = '1';
                }
            };

            if (images.length === 0) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
            } else {
                for (let img of images) {
                    img.onload = checkImagesLoaded;
                    img.onerror = checkImagesLoaded; // 确保即使加载失败也能继续
                }
            }
        } else {
            content.style.maxHeight = '0';
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.display = 'none';
            }, 500);
        }
    };

    toggleAnimation(!isVisible);
    setTimeout(() => {
        isAnimating = false;
    }, 500);
};

// 加载帖子并渲染
const loadPosts = async () => {
    const postFiles = await getPostFileList();
    const posts = await Promise.all(postFiles.map(fetchPost));
    displayPosts(posts.filter(post => post));
};

// 导航事件处理程序
const setupNavigation = () => {
    const fadeElements = {
        intro: introContent,
        about: aboutContent,
        contact: contactContent,
    };

    const fadeOut = (element, callback) => {
        element.style.opacity = '1';
        element.style.transition = 'opacity 0.5s ease';
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            callback();
        }, 500);
    };

    const fadeIn = (element) => {
        element.style.display = 'block';
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 15);
    };

    document.getElementById('aboutLink').addEventListener('click', (e) => {
        e.preventDefault();
        fadeOut(postList, () => {
            fadeElements.intro.style.display = 'block';
            fadeElements.about.style.display = 'block';
            fadeElements.contact.style.display = 'none';
            fadeIn(fadeElements.intro);
        });
    });

    document.getElementById('contactLink').addEventListener('click', (e) => {
        e.preventDefault();
        fadeOut(postList, () => {
            fadeElements.intro.style.display = 'block';
            fadeElements.contact.style.display = 'block';
            fadeElements.about.style.display = 'none';
            fadeIn(fadeElements.intro);
        });
    });

    document.getElementById('homeLink').addEventListener('click', (e) => {
        e.preventDefault();
        fadeOut(fadeElements.intro, () => {
            postList.style.display = 'block';
            fadeIn(postList);
        });
    });
};

setupNavigation();
loadPosts();