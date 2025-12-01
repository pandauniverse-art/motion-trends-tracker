// ========================================
// MOTION TRENDS ANALYTICS - MAIN APPLICATION
// ========================================

// Global State
let trendsData = null;
let currentLang = 'en';
let displayedVideos = 12;
let filteredVideos = [];
let charts = {
    trend: null,
    keyword: null,
    platform: null
};

// ========================================
// TRANSLATIONS
// ========================================

const translations = {
    ko: {
        siteTitle: '모션 트렌드 분석',
        tagline: '크리에이터를 위한 실시간 시장 인사이트',
        lastUpdated: '마지막 업데이트',
        totalVideos: '전체 영상',
        totalViews: '총 조회수',
        avgEngagement: '평균 참여도',
        topKeyword: '인기 키워드',
        viewsTrend: '조회수 트렌드 분석',
        topKeywords: '인기 키워드',
        platformDistribution: '플랫폼 분포',
        trendingKeywords: '트렌딩 키워드',
        searchKeywords: '키워드 검색...',
        sortBy: '정렬',
        sortViews: '조회수',
        sortEngagement: '참여도',
        sortRecent: '최신순',
        platform: '플랫폼',
        filterAll: '전체',
        filterToday: '오늘',
        filterWeek: '이번 주',
        filterMonth: '이번 달',
        dateRange: '기간',
        resetFilters: '필터 초기화',
        topVideos: '인기 영상',
        videosShowing: '개 영상 표시 중',
        loadMore: '더 보기',
        footerData: 'YouTube & Vimeo API에서 수집된 데이터',
        footerUpdate: '매일 오전 9시(KST) 업데이트',
        footerMadeBy: '제작:',
        loading: '데이터 로딩 중...',
        watchNow: '보기 →'
    },
    en: {
        siteTitle: 'Motion Trends Analytics',
        tagline: 'Real-time Market Intelligence for Creators',
        lastUpdated: 'Last Updated',
        totalVideos: 'Total Videos',
        totalViews: 'Total Views',
        avgEngagement: 'Avg Engagement',
        topKeyword: 'Top Keyword',
        viewsTrend: 'Views Trend Analysis',
        topKeywords: 'Top Keywords',
        platformDistribution: 'Platform Distribution',
        trendingKeywords: 'Trending Keywords',
        searchKeywords: 'Search keywords...',
        sortBy: 'Sort By',
        sortViews: 'Views',
        sortEngagement: 'Engagement',
        sortRecent: 'Recent',
        platform: 'Platform',
        filterAll: 'All',
        filterToday: 'Today',
        filterWeek: 'This Week',
        filterMonth: 'This Month',
        dateRange: 'Date Range',
        resetFilters: 'Reset Filters',
        topVideos: 'Top Performing Videos',
        videosShowing: 'videos showing',
        loadMore: 'Load More Videos',
        footerData: 'Data collected from YouTube & Vimeo APIs',
        footerUpdate: 'Updated daily at 9:00 AM KST',
        footerMadeBy: 'Made by',
        loading: 'Loading data...',
        watchNow: 'Watch Now →'
    }
};

// ========================================
// LANGUAGE SYSTEM
// ========================================

function detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('ko') ? 'ko' : 'en';
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('preferredLang', lang);
    
    // Update all translations
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.placeholder = translations[lang][key];
        }
    });
    
    // Update language toggle
    document.querySelectorAll('.lang-option').forEach(option => {
        option.classList.remove('active');
        if (option.getAttribute('data-lang') === lang) {
            option.classList.add('active');
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (currentLang === 'ko') {
        if (diffDays > 0) return `${diffDays}일 전`;
        if (diffHours > 0) return `${diffHours}시간 전`;
        return '방금 전';
    } else {
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return 'just now';
    }
}

// ========================================
// SUMMARY CARDS
// ========================================

function updateSummaryCards(data) {
    document.getElementById('totalVideos').textContent = data.totalVideos;
    document.getElementById('totalViews').textContent = formatNumber(data.summary.totalViews);
    document.getElementById('avgEngagement').textContent = data.summary.avgEngagement.toFixed(1);
    
    if (data.keywordTrends && data.keywordTrends.length > 0) {
        document.getElementById('topKeyword').textContent = data.keywordTrends[0].keyword;
        document.getElementById('topKeywordCount').textContent = `${data.keywordTrends[0].count} ${currentLang === 'ko' ? '회 언급' : 'mentions'}`;
    }
    
    document.getElementById('lastUpdated').textContent = formatDate(data.lastUpdated);
}

// ========================================
// CHARTS
// ========================================

function createTrendChart(data) {
    const ctx = document.getElementById('trendChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (charts.trend) {
        charts.trend.destroy();
    }
    
    // Generate sample data (7 days)
    const labels = [];
    const viewsData = [];
    const engagementData = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString(currentLang === 'ko' ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric' }));
        
        // Simulate trend data
        const baseViews = data.summary.totalViews / 7;
        viewsData.push(Math.floor(baseViews * (0.8 + Math.random() * 0.4)));
        engagementData.push(Math.floor(data.summary.avgEngagement * (0.9 + Math.random() * 0.2)));
    }
    
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: currentLang === 'ko' ? '조회수' : 'Views',
                    data: viewsData,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: currentLang === 'ko' ? '참여도' : 'Engagement',
                    data: engagementData,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#ffffff',
                    bodyColor: '#94a3b8',
                    borderColor: '#a855f7',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(168, 85, 247, 0.1)' },
                    ticks: { color: '#64748b', font: { size: 11 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#64748b', font: { size: 11 } }
                }
            }
        }
    });
}

function createKeywordChart(data) {
    const ctx = document.getElementById('keywordChart');
    if (!ctx) return;
    
    if (charts.keyword) {
        charts.keyword.destroy();
    }
    
    const topKeywords = data.keywordTrends.slice(0, 8);
    
    charts.keyword = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topKeywords.map(k => k.keyword),
            datasets: [{
                label: currentLang === 'ko' ? '언급 횟수' : 'Mentions',
                data: topKeywords.map(k => k.count),
                backgroundColor: 'rgba(168, 85, 247, 0.8)',
                borderColor: '#a855f7',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#ffffff',
                    bodyColor: '#94a3b8',
                    borderColor: '#a855f7',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(168, 85, 247, 0.1)' },
                    ticks: { color: '#64748b', font: { size: 11 } }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8', font: { size: 11, weight: 'bold' } }
                }
            }
        }
    });
}

function createPlatformChart(data) {
    const ctx = document.getElementById('platformChart');
    if (!ctx) return;
    
    if (charts.platform) {
        charts.platform.destroy();
    }
    
    const youtubeCount = data.summary.youtubeVideos || 0;
    const vimeoCount = (data.totalVideos || 0) - youtubeCount;
    
    charts.platform = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['YouTube', 'Vimeo'],
            datasets: [{
                data: [youtubeCount, vimeoCount],
                backgroundColor: [
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(6, 182, 212, 0.8)'
                ],
                borderColor: ['#a855f7', '#06b6d4'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#94a3b8',
                        font: { size: 12, weight: 'bold' },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: '#1a1f2e',
                    titleColor: '#ffffff',
                    bodyColor: '#94a3b8',
                    borderColor: '#a855f7',
                    borderWidth: 1,
                    padding: 12
                }
            }
        }
    });
}

// ========================================
// KEYWORDS RENDERING
// ========================================

function renderKeywords(keywords) {
    const grid = document.getElementById('keywordsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    keywords.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'keyword-card fade-in';
        card.innerHTML = `
            <div class="keyword-info">
                <div class="keyword-rank">#${index + 1}</div>
                <div class="keyword-name">${item.keyword}</div>
            </div>
            <div class="keyword-count">${item.count}</div>
        `;
        grid.appendChild(card);
    });
}

// ========================================
// VIDEOS RENDERING
// ========================================

function createVideoCard(video, rank = null) {
    const card = document.createElement('div');
    card.className = 'video-card fade-in';
    
    const platformEmoji = video.platform === 'youtube' ? '▶️' : '🎬';
    const rankBadge = rank ? `<div class="video-rank-badge">#${rank}</div>` : '';
    
    card.innerHTML = `
        <div class="video-thumbnail">
            ${rankBadge}
            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
            <div class="video-platform-badge">${platformEmoji} ${video.platform}</div>
        </div>
        <div class="video-content">
            <h3 class="video-title">${video.title}</h3>
            <p class="video-channel">📺 ${video.channel}</p>
            <div class="video-stats">
                <div class="video-stat">
                    <span class="stat-icon-small">👁️</span>
                    <span class="stat-value-small">${formatNumber(video.viewCount)}</span>
                </div>
                <div class="video-stat">
                    <span class="stat-icon-small">👍</span>
                    <span class="stat-value-small">${formatNumber(video.likeCount)}</span>
                </div>
                <div class="video-stat">
                    <span class="stat-icon-small">💬</span>
                    <span class="stat-value-small">${formatNumber(video.commentCount)}</span>
                </div>
            </div>
            <div class="video-footer">
                <div class="engagement-score">
                    ⚡ ${video.engagementScore.toFixed(1)}
                </div>
                <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="watch-btn">
                    ${translations[currentLang].watchNow}
                </a>
            </div>
        </div>
    `;
    
    return card;
}

function renderVideos(videos, limit = displayedVideos) {
    const grid = document.getElementById('videosGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const videosToShow = videos.slice(0, limit);
    videosToShow.forEach((video, index) => {
        const card = createVideoCard(video, index + 1);
        grid.appendChild(card);
    });
    
    // Update count
    document.getElementById('videoCount').textContent = videosToShow.length;
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.style.display = videos.length > limit ? 'inline-block' : 'none';
    }
}

// ========================================
// FILTERS
// ========================================

function applyFilters() {
    if (!trendsData) return;
    
    const sortBy = document.getElementById('sortFilter').value;
    const platform = document.getElementById('platformFilter').value;
    const dateRange = document.getElementById('dateFilter').value;
    
    // Start with all videos
    let videos = [...trendsData.topVideos];
    
    // Platform filter
    if (platform !== 'all') {
        videos = videos.filter(v => v.platform === platform);
    }
    
    // Date filter (simplified - would need actual dates in data)
    // This is placeholder logic
    if (dateRange !== 'all') {
        // In real implementation, filter by actual dates
    }
    
    // Sort
    if (sortBy === 'views') {
        videos.sort((a, b) => b.viewCount - a.viewCount);
    } else if (sortBy === 'engagement') {
        videos.sort((a, b) => b.engagementScore - a.engagementScore);
    } else if (sortBy === 'recent') {
        videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    }
    
    filteredVideos = videos;
    displayedVideos = 12;
    renderVideos(filteredVideos, displayedVideos);
}

// ========================================
// SEARCH
// ========================================

function setupSearch() {
    const searchInput = document.getElementById('keywordSearch');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (!query) {
            renderKeywords(trendsData.keywordTrends);
            return;
        }
        
        const filtered = trendsData.keywordTrends.filter(k =>
            k.keyword.toLowerCase().includes(query)
        );
        
        renderKeywords(filtered);
    });
}

// ========================================
// EVENT LISTENERS
// ========================================

function setupEventListeners() {
    // Language toggle
    document.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            setLanguage(lang);
            if (trendsData) {
                createTrendChart(trendsData);
                createKeywordChart(trendsData);
                createPlatformChart(trendsData);
            }
        });
    });
    
    // Filters
    ['sortFilter', 'platformFilter', 'dateFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyFilters);
        }
    });
    
    // Reset filters
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            document.getElementById('sortFilter').value = 'views';
            document.getElementById('platformFilter').value = 'all';
            document.getElementById('dateFilter').value = 'all';
            applyFilters();
        });
    }
    
    // Load more
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            displayedVideos += 12;
            renderVideos(filteredVideos, displayedVideos);
        });
    }
    
    // Search
    setupSearch();
}

// ========================================
// DATA LOADING
// ========================================

async function loadData() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    
    try {
        const response = await fetch('data/trends.json');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        trendsData = await response.json();
        filteredVideos = trendsData.topVideos;
        
        // Update all sections
        updateSummaryCards(trendsData);
        createTrendChart(trendsData);
        createKeywordChart(trendsData);
        createPlatformChart(trendsData);
        renderKeywords(trendsData.keywordTrends);
        renderVideos(filteredVideos);
        
        // Hide loading
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
        
        console.log('✅ Dashboard loaded successfully!');
        
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">😕</div>
                    <h2 style="color: white; margin-bottom: 16px;">
                        ${currentLang === 'ko' ? '데이터를 불러올 수 없습니다' : 'Failed to Load Data'}
                    </h2>
                    <p style="color: #94a3b8; margin-bottom: 24px;">
                        ${currentLang === 'ko' ? '잠시 후 다시 시도해주세요' : 'Please try again later'}
                    </p>
                    <button onclick="location.reload()" style="padding: 14px 32px; background: linear-gradient(135deg, #a855f7, #ec4899); border: none; border-radius: 12px; color: white; font-weight: 700; cursor: pointer; font-size: 15px;">
                        ${currentLang === 'ko' ? '새로고침' : 'Reload'}
                    </button>
                </div>
            `;
        }
    }
}

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Set initial language
    const savedLang = localStorage.getItem('preferredLang') || detectBrowserLanguage();
    currentLang = savedLang;
    setLanguage(savedLang);
    
    // Setup event listeners
    setupEventListeners();
    
    // Load data
    loadData();
    
    // Auto-refresh every 10 minutes
    setInterval(() => {
        console.log('🔄 Auto-refreshing data...');
        loadData();
    }, 10 * 60 * 1000);
});
