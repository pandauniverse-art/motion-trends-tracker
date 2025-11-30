import os
import json
import requests
from datetime import datetime

# Vimeo Access Token
ACCESS_TOKEN = os.getenv('VIMEO_ACCESS_TOKEN')

def search_videos(query, per_page=30):
    """Vimeo에서 비디오 검색"""
    headers = {
        'Authorization': f'bearer {ACCESS_TOKEN}',
        'Accept': 'application/vnd.vimeo.*+json;version=3.4'
    }
    
    params = {
        'query': query,
        'per_page': per_page,
        'sort': 'relevant',
        'filter': 'CC'
    }
    
    response = requests.get(
        'https://api.vimeo.com/videos',
        headers=headers,
        params=params
    )
    
    if response.status_code != 200:
        print(f"⚠️ Vimeo API 오류: {response.status_code}")
        return []
    
    data = response.json()
    
    videos = []
    for item in data.get('data', []):
        videos.append({
            'id': item['uri'].split('/')[-1],
            'title': item['name'],
            'description': item['description'][:200] if item.get('description') else '',
            'url': item['link'],
            'thumbnail': item['pictures']['sizes'][-1]['link'] if item.get('pictures') else '',
            'duration': item.get('duration', 0),
            'created_at': item['created_time'],
            'view_count': item['stats'].get('plays', 0),
            'like_count': item['metadata']['connections']['likes']['total'],
            'comment_count': item['metadata']['connections']['comments']['total'],
            'user': {
                'name': item['user']['name'],
                'url': item['user']['link']
            },
            'tags': [tag['name'] for tag in item.get('tags', [])[:5]]
        })
    
    return videos

def main():
    """메인 실행 함수"""
    print("🎬 Vimeo 데이터 수집 시작...")
    
    queries = [
        'motion graphics',
        '3d animation',
        'motion design'
    ]
    
    all_videos = []
    
    for query in queries:
        print(f"  검색 중: {query}")
        videos = search_videos(query, per_page=10)
        all_videos.extend(videos)
    
    # 중복 제거
    unique_videos = {v['id']: v for v in all_videos}.values()
    
    # JSON 저장
    output = {
        'platform': 'vimeo',
        'updated_at': datetime.now().isoformat(),
        'total_count': len(unique_videos),
        'videos': list(unique_videos)
    }
    
    os.makedirs('public/data', exist_ok=True)
    
    with open('public/data/vimeo.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Vimeo 데이터 수집 완료: {len(unique_videos)}개 비디오")

if __name__ == '__main__':
    main()
