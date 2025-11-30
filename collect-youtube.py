import os
import json
import requests
from datetime import datetime, timedelta

# YouTube API 설정
API_KEY = os.environ.get('YOUTUBE_API_KEY')
BASE_URL = 'https://www.googleapis.com/youtube/v3'

# 검색 키워드
KEYWORDS = [
    'motion graphics 2024',
    'motion design trends',
    'after effects animation',
    'cinema 4d motion',
    'blender motion graphics',
    '3d motion design'
]

def search_youtube(keyword, max_results=10):
    """YouTube에서 키워드로 비디오 검색"""
    # 최근 30일간 비디오만 검색
    published_after = (datetime.now() - timedelta(days=30)).isoformat() + 'Z'
    
    params = {
        'part': 'snippet',
        'q': keyword,
        'type': 'video',
        'order': 'viewCount',
        'maxResults': max_results,
        'publishedAfter': published_after,
        'key': API_KEY
    }
    
    response = requests.get(f'{BASE_URL}/search', params=params)
    return response.json()

def get_video_stats(video_ids):
    """비디오 통계 가져오기"""
    params = {
        'part': 'statistics,contentDetails',
        'id': ','.join(video_ids),
        'key': API_KEY
    }
    
    response = requests.get(f'{BASE_URL}/videos', params=params)
    return response.json()

def collect_youtube_data():
    """YouTube 데이터 수집 메인 함수"""
    all_videos = []
    
    for keyword in KEYWORDS:
        print(f"Searching YouTube for: {keyword}")
        search_results = search_youtube(keyword)
        
        if 'items' not in search_results:
            print(f"No results for {keyword}")
            continue
        
        # 비디오 ID 추출
        video_ids = [item['id']['videoId'] for item in search_results['items']]
        
        # 비디오 통계 가져오기
        stats_data = get_video_stats(video_ids)
        
        # 데이터 병합
        for item, stats in zip(search_results['items'], stats_data.get('items', [])):
            video_data = {
                'platform': 'youtube',
                'id': item['id']['videoId'],
                'title': item['snippet']['title'],
                'description': item['snippet']['description'],
                'thumbnail': item['snippet']['thumbnails']['high']['url'],
                'channel': item['snippet']['channelTitle'],
                'publishedAt': item['snippet']['publishedAt'],
                'url': f"https://www.youtube.com/watch?v={item['id']['videoId']}",
                'viewCount': int(stats.get('statistics', {}).get('viewCount', 0)),
                'likeCount': int(stats.get('statistics', {}).get('likeCount', 0)),
                'commentCount': int(stats.get('statistics', {}).get('commentCount', 0)),
                'duration': stats.get('contentDetails', {}).get('duration', ''),
                'keyword': keyword,
                'collectedAt': datetime.now().isoformat()
            }
            all_videos.append(video_data)
    
    # 조회수 기준 정렬
    all_videos.sort(key=lambda x: x['viewCount'], reverse=True)
    
    # 상위 50개만 저장
    return all_videos[:50]

if __name__ == '__main__':
    print("=== YouTube Data Collection Started ===")
    
    if not API_KEY:
        print("ERROR: YOUTUBE_API_KEY not found in environment variables")
        exit(1)
    
    videos = collect_youtube_data()
    
    # 결과 저장
    output_dir = 'public/data'
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = f'{output_dir}/youtube_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Collected {len(videos)} YouTube videos")
    print(f"📁 Saved to {output_file}")
