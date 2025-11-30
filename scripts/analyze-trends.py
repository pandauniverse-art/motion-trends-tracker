import json
import os
from datetime import datetime
from collections import Counter

def load_data():
    """YouTube와 Vimeo 데이터 로드"""
    youtube_file = 'public/data/youtube_data.json'
    vimeo_file = 'public/data/vimeo_data.json'
    
    youtube_data = []
    vimeo_data = []
    
    if os.path.exists(youtube_file):
        with open(youtube_file, 'r', encoding='utf-8') as f:
            youtube_data = json.load(f)
    
    if os.path.exists(vimeo_file):
        with open(vimeo_file, 'r', encoding='utf-8') as f:
            vimeo_data = json.load(f)
    
    return youtube_data + vimeo_data

def extract_keywords(videos):
    """키워드 추출 및 분석"""
    all_keywords = []
    for video in videos:
        all_keywords.append(video['keyword'])
    
    return Counter(all_keywords).most_common(10)

def calculate_engagement(video):
    """참여도 점수 계산"""
    views = video.get('viewCount', 0)
    likes = video.get('likeCount', 0)
    comments = video.get('commentCount', 0)
    
    if views == 0:
        return 0
    
    engagement = ((likes + comments * 2) / views) * 1000
    return round(engagement, 2)

def analyze_trends():
    """트렌드 분석 메인 함수"""
    videos = load_data()
    
    if not videos:
        print("No data to analyze")
        return None
    
    for video in videos:
        video['engagementScore'] = calculate_engagement(video)
    
    keyword_trends = extract_keywords(videos)
    
    platform_stats = {
        'youtube': {'count': 0, 'totalViews': 0},
        'vimeo': {'count': 0, 'totalViews': 0}
    }
    
    for video in videos:
        platform = video['platform']
        platform_stats[platform]['count'] += 1
        platform_stats[platform]['totalViews'] += video.get('viewCount', 0)
    
    top_videos = sorted(videos, key=lambda x: x['viewCount'], reverse=True)[:20]
    top_engagement = sorted(videos, key=lambda x: x['engagementScore'], reverse=True)[:10]
    
    result = {
        'lastUpdated': datetime.now().isoformat(),
        'totalVideos': len(videos),
        'keywordTrends': [{'keyword': k, 'count': c} for k, c in keyword_trends],
        'platformStats': platform_stats,
        'topVideos': top_videos,
        'topEngagement': top_engagement,
        'summary': {
            'youtubeVideos': platform_stats['youtube']['count'],
            'vimeoVideos': platform_stats['vimeo']['count'],
            'totalViews': sum(v['totalViews'] for v in platform_stats.values()),
            'avgEngagement': round(sum(v['engagementScore'] for v in videos) / len(videos), 2)
        }
    }
    
    return result

if __name__ == '__main__':
    print("=== Trend Analysis Started ===")
    
    result = analyze_trends()
    
    if result:
        output_file = 'public/data/trends.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Analysis complete")
        print(f"📊 Total videos: {result['totalVideos']}")
        print(f"📁 Saved to {output_file}")
    else:
        print("❌ No data to analyze")
