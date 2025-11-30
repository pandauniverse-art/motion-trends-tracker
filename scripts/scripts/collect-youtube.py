import os
import json
from datetime import datetime
from googleapiclient.discovery import build

# API 키 가져오기
API_KEY = os.getenv('YOUTUBE_API_KEY')

def search_videos(query, max_results=30):
    """YouTube에서 비디오 검색"""
    youtube = build('youtube', 'v3', developerKey=API_KEY)
    
    request = youtube.search().list(
        part='snippet',
        q=query,
        type='video',
        order='viewCount',
        maxResults=max_results,
        relevanceLanguage='en'
    )
    
    response = request.execute()
    
    video_ids = [item['id']['videoId'] for item in response['items']]
    
    # 비디오 상세 정보 가져오기
    videos_request = youtube.videos().list(
        part='statistics,snippet',
        id=','.join(video_ids)
    )
    
    videos_response = videos_request.execute()
    
    videos = []
    for item in videos_response['items']:
        videos.append({
            'id': item['id'],
            'title': item['snippet']['title'],
            'channel': item['snippet']['channelTitle'],
            'description': item['snippet']['description'][:200],
            'thumbnail': item['snippet']['thumbnails']['high']['url'],
            'published_at': item['snippet']['publishedAt'],
            'view_count': int(item['statistics'].get('viewCount', 0)),
            'like_count': int(item['statistics'].get('likeCount', 0)),
            'comment_count': int(item['statistics'].get('commentCount', 0)),
            'url': f"https://www.youtube.com/watch?v={item['id']}",
            'tags': item['snippet'].get('tags', [])[:5]
        })
    
    return videos

def main():
    """메인 실행 함수"""
    print("🎬 YouTube 데이터 수집 시작...")
    
    queries = [
        'motion graphics',
        '3d animation',
        'motion design'
    ]
    
    all_videos = []
    
    for query in queries:
        print(f"  검색 중: {query}")
        videos = search_videos(query, max_results=10)
        all_videos.extend(videos)
    
    # 중복 제거 (video id 기준)
    unique_videos = {v['id']: v for v in all_videos}.values()
    
    # JSON 저장
    output = {
        'platform': 'youtube',
        'updated_at': datetime.now().isoformat(),
        'total_count': len(unique_videos),
        'videos': list(unique_videos)
    }
    
    os.makedirs('public/data', exist_ok=True)
    
    with open('public/data/youtube.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"✅ YouTube 데이터 수집 완료: {len(unique_videos)}개 비디오")

if __name__ == '__main__':
    main()
