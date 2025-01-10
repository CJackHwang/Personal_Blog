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

// 分页显示帖子
const displayPosts = (posts) => {
    const postsPerPage = 4;
    const totalPages = Math.ceil(posts.length / postsPerPage);
    const pagination = document.createElement('div');
    pagination.className = 'pagination';

    const showPage = (page) => {
        postList.style.transition = 'opacity 0.5s ease'; // 添加过渡效果
        postList.style.opacity = '0'; // 先将当前内容渐隐

        setTimeout(() => {
            postList.innerHTML = ''; // 清空当前内容
            const start = (page - 1) * postsPerPage;
            const end = start + postsPerPage;

            const fragment = document.createDocumentFragment();
            posts.slice(start, end).forEach((post, index) => {
                if (post) {
                    const postCard = document.createElement('div');
                    postCard.className = 'post-card';
                    postCard.onclick = () => toggleContent(start + index);
                    postCard.innerHTML = `
                    <h2>${post.title}</h2>
                    <p class="meta">${post.meta}</p>
                    <div class="content" id="content-${start + index}"
                    style="display: none; opacity: 0; max-height: 0; transition: max-height 0.5s ease, opacity 0.5s ease;"
                    data-fulltext="${encodeURIComponent(post.content)}"></div>
                    `;
                    fragment.appendChild(postCard);
                }
            });

            postList.appendChild(fragment);
            updatePagination(page);
            postList.style.opacity = '1'; // 渐显新内容
        }, 500); // 与fade-out时间一致
    };

    const updatePagination = (currentPage) => {
        pagination.innerHTML = '';

        // 首页按钮
        const firstButton = document.createElement('button');
        firstButton.innerText = '首页';
        firstButton.onclick = () => showPage(1);
        pagination.appendChild(firstButton);

        // 动态中间页码按钮
        const pageButtons = [];
        const startPage = Math.max(1, currentPage - 1);
        const endPage = Math.min(totalPages, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            if (i <= totalPages) {
                const button = document.createElement('button');
                button.innerText = i;
                button.onclick = () => showPage(i);
                if (i === currentPage) {
                    button.classList.add('active'); // 高亮当前页
                }
                pageButtons.push(button);
            }
        }

        // 确保至少有一个数字按钮
        if (pageButtons.length === 0) {
            const fallbackButton = document.createElement('button');
            fallbackButton.innerText = '1';
            fallbackButton.onclick = () => showPage(1);
            pageButtons.push(fallbackButton);
        }

        // 添加中间页码按钮
        pageButtons.forEach(button => pagination.appendChild(button));

        // 尾页按钮
        if (totalPages > 1) {
            const lastButton = document.createElement('button');
            lastButton.innerText = '尾页';
            lastButton.onclick = () => showPage(totalPages);
            pagination.appendChild(lastButton);
        }

        postList.appendChild(pagination);
    };

    showPage(1); // 默认显示第一页
};

let isAnimating = false;

// 切换帖子内容显示
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

            // 初步展开文本并缓存高度
            const fullHeight = content.scrollHeight;
            content.style.maxHeight = `${fullHeight}px`;
            content.style.opacity = '1';

            // 加载图片
            const images = content.getElementsByTagName('img');
            let loadedImages = 0;

            const checkImagesLoaded = () => {
                loadedImages++;
                if (loadedImages === images.length) {
                    content.style.maxHeight = `${content.scrollHeight}px`;
                }
            };

            if (images.length === 0) {
                content.style.maxHeight = `${fullHeight}px`;
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
    const posts = [];

    for (let file of postFiles) {
        const post = await fetchPost(file);
        if (post) posts.push(post);
    }

    displayPosts(posts);
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