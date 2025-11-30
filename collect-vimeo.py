import os
import json
import requests
from datetime import datetime, timedelta

# Vimeo API 설정
ACCESS_TOKEN = os.environ.get('VIMEO_ACCESS_TOKEN')
BASE_URL = 'https://api.vimeo.com'

# 검색 키워드
KEYWORDS = [
    'motion graphics',
    'motion design',
    '3d animation',
    'cinema 4d',
    'after effects',
    'creative coding'
]

def search_vimeo(keyword, per_page=10):
    """Vimeo에서 키워드로 비디오 검색"""
    headers = {
        'Authorization': f'bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    params = {
        'query': keyword,
        'per_page': per_page,
        'sort': 'likes',
        'direction': 'desc',
        'filter': 'CC',  # Creative Commons
    }
    
    response = requests.get(f'{BASE_URL}/videos', headers=headers, params=params)
    return response.json()

def collect_vimeo_data():
    """Vimeo 데이터 수집 메인 함수"""
    all_videos = []
    
    for keyword in KEYWORDS:
        print(f"Searching Vimeo for: {keyword}")
        search_results = search_vimeo(keyword)
        
        if 'data' not in search_results:
            print(f"No results for {keyword}")
            continue
        
        for item in search_results['data']:
            # 최근 30일 이내 비디오만 필터링
            created_time = datetime.fromisoformat(item['created_time'].replace('Z', '+00:00'))
            if (datetime.now().astimezone() - created_time).days > 30:
                continue
            
            video_data = {
                'platform': 'vimeo',
                'id': item['uri'].split('/')[-1],
                'title': item['name'],
                'description': item.get('description', ''),
                'thumbnail': item['pictures']['sizes'][-1]['link'] if item.get('pictures') else '',
                'channel': item['user']['name'],
                'publishedAt': item['created_time'],
                'url': item['link'],
                'viewCount': item['stats']['plays'],
                'likeCount': item['metadata']['connections']['likes']['total'],
                'commentCount': item['metadata']['connections']['comments']['total'],
                'duration': item['duration'],
                'keyword': keyword,
                'collectedAt': datetime.now().isoformat()
            }
            all_videos.append(video_data)
    
    # 조회수 기준 정렬
    all_videos.sort(key=lambda x: x['viewCount'], reverse=True)
    
    # 상위 30개만 저장
    return all_videos[:30]

if __name__ == '__main__':
    print("=== Vimeo Data Collection Started ===")
    
    if not ACCESS_TOKEN:
        print("ERROR: VIMEO_ACCESS_TOKEN not found in environment variables")
        exit(1)
    
    videos = collect_vimeo_data()
    
    # 결과 저장
    output_dir = 'public/data'
    os.makedirs(output_dir, exist_ok=True)
    
    output_file = f'{output_dir}/vimeo_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(videos, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Collected {len(videos)} Vimeo videos")
    print(f"📁 Saved to {output_file}")
