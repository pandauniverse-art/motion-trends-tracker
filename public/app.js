// 데이터 로드 및 대시보드 초기화
let trendsData = null;

// 숫자 포맷팅 함수
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));

    if (diffDays > 0) {
        return `${diffDays}일 전`;
    } else if (diffHours > 0) {
        return `${diffHours}시간 전`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes}분 전`;
    } else {
        return '방금 전';
    }
}

// Summary Cards 업데이트
function updateSummaryCards(data) {
    document.getElementById('totalVideos').textContent = data.totalVideos;
    document.getElementById('totalViews').textContent = formatNumber(data.summary.totalViews);
    document.getElementById('avgEngagement').textContent = data.summary.avgEngagement.toFixed(1);
    document.getElementById('youtubeVideos').textContent = data.summary.youtubeVideos;
    document.getElementById('lastUpdated').textContent = formatDate(data.lastUpdated);
}

// Keyword Grid 렌더링
function renderKeywords(keywords) {
    const keywordGrid = document.getElementById('keywordGrid');
    keywordGrid.innerHTML = '';

    keywords.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'keyword-card';
        card.innerHTML = `
            <div class="keyword-name">
                <span style="font-weight: 900; color: #a855f7; margin-right: 8px;">#${index + 1}</span>
                ${item.keyword}
            </div>
            <div class="keyword-count">${item.count}</div>
        `;
        keywordGrid.appendChild(card);
    });
}

// Video Card 생성
function createVideoCard(video, rank = null) {
    const card = document.createElement('div');
    card.className = 'video-card';
    
    const platformEmoji = video.platform === 'youtube' ? '▶️' : '🎬';
    const rankBadge = rank ? `<span style="position: absolute; top: 12px; left: 12px; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); padding: 8px 12px; border-radius: 8px; font-size: 16px; font-weight: 900; color: #fff;">#${rank}</span>` : '';
    
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
                <div class="stat">
                    <span class="stat-icon">👀</span>
                    <span class="stat-number">${formatNumber(video.viewCount)}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon">👍</span>
                    <span class="stat-number">${formatNumber(video.likeCount)}</span>
                </div>
                <div class="stat">
                    <span class="stat-icon">💬</span>
                    <span class="stat-number">${formatNumber(video.commentCount)}</span>
                </div>
            </div>
            <div class="video-footer">
                <div class="engagement-badge">
                    ⚡ ${video.engagementScore.toFixed(1)}
                </div>
                <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="view-button">
                    Watch Now →
                </a>
            </div>
        </div>
    `;
    
    return card;
}

// Top Videos 렌더링
function renderTopVideos(videos) {
    const grid = document.getElementById('topVideosGrid');
    grid.innerHTML = '';

    videos.slice(0, 12).forEach((video, index) => {
        const card = createVideoCard(video, index + 1);
        grid.appendChild(card);
    });
}

// Top Engagement 렌더링
function renderTopEngagement(videos) {
    const grid = document.getElementById('topEngagementGrid');
    grid.innerHTML = '';

    videos.slice(0, 9).forEach((video, index) => {
        const card = createVideoCard(video, index + 1);
        grid.appendChild(card);
    });
}

// 데이터 로드
async function loadData() {
    try {
        const response = await fetch('data/trends.json');
        if (!response.ok) {
            throw new Error('Failed to load data');
        }
        
        trendsData = await response.json();
        
        // 대시보드 업데이트
        updateSummaryCards(trendsData);
        renderKeywords(trendsData.keywordTrends);
        renderTopVideos(trendsData.topVideos);
        renderTopEngagement(trendsData.topEngagement);
        
        console.log('✅ Dashboard loaded successfully!');
    } catch (error) {
        console.error('❌ Error loading data:', error);
        
        // 에러 메시지 표시
        document.querySelector('.main-content').innerHTML = `
            <div class="container" style="text-align: center; padding: 100px 20px;">
                <div style="font-size: 64px; margin-bottom: 20px;">😕</div>
                <h2 style="color: white; margin-bottom: 16px;">데이터를 불러올 수 없습니다</h2>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 24px;">
                    잠시 후 다시 시도해주세요.
                </p>
                <button onclick="location.reload()" style="padding: 12px 24px; background: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    새로고침
                </button>
            </div>
        `;
    }
}

// 페이지 로드 시 데이터 로드
document.addEventListener('DOMContentLoaded', loadData);

// 자동 새로고침 (10분마다)
setInterval(() => {
    console.log('🔄 Auto-refreshing data...');
    loadData();
}, 10 * 60 * 1000);
