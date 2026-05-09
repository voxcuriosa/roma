import requests
import json
import os
import time

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}

BLACKLIST = [
    "Table", "Disillusioned Medea", "Choir of the Capuchin Church", "Jerusalem", "Cairo", 
    "American portraits", "Luigi Piana", "Guide to the special collections", "Fifty years of art",
    "Engraving", "Catalogue of a collection", "story of American painting", "McNeill Whistler",
    "English illustration", "Walt Whitman", "Colour studies in Paris", "Philadelphia",
    "practical treatise", "Memories", "Handbook", "Portfolio", "Pen drawing", "Albrecht Dü",
    "Holbein", "Florida", "Bunker Hill", "London days", "The capital", "William Penn memorial",
    "Defenders of democracy", "Punch", "Pictures of the French", "tribute book", "Samuel Morris",
    "Illustrated catalogue", "portraits of Washington", "Japanese figure prints", "graphic arts",
    "new New York", "architects and engineers", "Our Philadelphia", "Romola", "Washington National Monument",
    "Salve Venetia", "Richard Watson Gilder", "Plymouth", "Luzerne", "Tractor", "Hyperion", 
    "history of the United States", "Collected poems", "Book", "Catalogue", "Portrait",
    "Caesarea", "Palestine", "Israel", "Egypt", "Gaza", "Syria", "Lebanon", "Athens", "Greece", "Milan", "Firenze", "Venice",
    "Göring", "Mussolini", "Hitler", "Fascist", "Nazi", "WW2", "War", "Soldier", "Military", "Goring"
]

def clean_title(title):
    if not title: return "Rome Vintage Photo"
    title = title.replace('[', '').replace(']', '')
    for suffix in [', Rome', ', Italy', ' Rome', ' Italy']:
        if suffix in title:
            title = title.split(suffix)[0]
    return title.strip()

def is_valid_rome_asset(item):
    title = item.get('title', '')
    if not title: return False
    t_lower = title.lower()
    for b in BLACKLIST:
        if b.lower() in t_lower:
            return False
    if not ("rome" in t_lower or "roma" in t_lower):
        return False
    exclude = ["milan", "florence", "venice", "naples", "tuscany", "toscana", "firenze", "milano", "venezia", "napoli", "pisa", "amalfi", "turin", "vicinity"]
    for city in exclude:
        if city in t_lower:
            return False
    return True

def download_photos():
    if not os.path.exists('assets/historical/photos'):
        os.makedirs('assets/historical/photos')

    metadata = []
    if os.path.exists('data/vintage_metadata.json'):
        with open('data/vintage_metadata.json', 'r') as f:
            metadata = json.load(f)
    
    existing_ids = {m['id'] for m in metadata}
    count = len(metadata)
    
    queries = [
        "Rome+Italy+Photochrom",
        "Veduta+di+Roma+foto",
        "Piazza+di+Spagna+Roma",
        "Fontana+di+Trevi+Roma",
        "Pantheon+Roma+foto",
        "Foro+Romano+foto",
        "Colosseo+Roma+foto",
        "Vaticano+Roma+foto",
        "Trastevere+Roma+foto",
        "Appia+Antica+Roma"
    ]
    
    max_total = 100
    
    for q in queries:
        if count >= max_total: break
        print(f"Searching: {q}...")
        try:
            url = f"https://www.loc.gov/photos/?q={q}&fo=json&c=300"
            res = requests.get(url, headers=HEADERS, timeout=15)
            if res.status_code != 200: continue
            
            data = res.json()
            results = data.get('results', [])
            
            for item in results:
                if count >= max_total: break
                if not is_valid_rome_asset(item): continue
                
                img_id = item.get('id', '').split('/')[-2]
                id_key = f"loc_{img_id}"
                if id_key in existing_ids: continue
                
                img_urls = item.get('image_url', [])
                if not img_urls: continue
                best_url = "https:" + img_urls[-1] if img_urls[-1].startswith("//") else img_urls[-1]
                img_name = f"vintage_loc_{img_id}.jpg"
                img_path = os.path.join('assets/historical/photos', img_name)
                
                if not os.path.exists(img_path):
                    try:
                        img_res = requests.get(best_url, headers=HEADERS, timeout=15)
                        if img_res.status_code == 200:
                            with open(img_path, 'wb') as f: f.write(img_res.content)
                        else: continue
                    except: continue

                metadata.append({
                    "id": id_key,
                    "title": clean_title(item.get('title')),
                    "artist": item.get('creator', ['Unknown Photographer'])[0] if item.get('creator') else "Unknown",
                    "date": item.get('date', '19th Century'),
                    "image": f"assets/historical/photos/{img_name}",
                    "source": "Library of Congress, Prints and Photographs Division",
                    "rights": item.get('rights_information', 'Public Domain'),
                    "link": f"https://www.loc.gov/item/{img_id}/"
                })
                existing_ids.add(id_key)
                count += 1
                print(f"[{count}] Added: {metadata[-1]['title']}")
                
                if count % 10 == 0:
                    with open('data/vintage_metadata.json', 'w', encoding='utf-8') as f:
                        json.dump(metadata, f, indent=2, ensure_ascii=False)
                time.sleep(0.01)
        except: continue

    with open('data/vintage_metadata.json', 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    print(f"\nFinal count: {len(metadata)}")

if __name__ == "__main__":
    download_photos()
