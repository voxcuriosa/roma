import xml.etree.ElementTree as ET
import json
import re

def parse_kml(kml_path):
    tree = ET.parse(kml_path)
    root = tree.getroot()
    
    # KML namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    features = []
    
    # Styles for colors
    styles = {}
    for style in root.findall('.//kml:Style', ns):
        style_id = style.get('id')
        poly_style = style.find('kml:PolyStyle', ns)
        if poly_style is not None:
            color_elem = poly_style.find('kml:color', ns)
            if color_elem is not None:
                # KML color is aabbggrr
                kml_color = color_elem.text
                if kml_color and len(kml_color) == 8:
                    # Convert to #rrggbb
                    # r = kml_color[6:8], g = kml_color[4:6], b = kml_color[2:4]
                    hex_color = f"#{kml_color[6:8]}{kml_color[4:6]}{kml_color[2:4]}"
                    styles[style_id] = hex_color

    for placemark in root.findall('.//kml:Placemark', ns):
        name_elem = placemark.find('kml:name', ns)
        name = name_elem.text if name_elem is not None else "Unknown"
        
        description_elem = placemark.find('kml:description', ns)
        desc_text = description_elem.text if description_elem is not None else ""
        
        # Extract YouTube link
        youtube_match = re.search(r'https?://(?:www\.)?youtu(?:be\.com/watch\?v=|\.be/)[\w-]+', desc_text)
        youtube_link = youtube_match.group(0) if youtube_match else ""
        
        style_url = placemark.find('kml:styleUrl', ns)
        style_id = style_url.text.replace('#', '') if style_url is not None else ""
        color = styles.get(style_id, "#ff0000")
        
        geometry = None
        point = placemark.find('kml:Point', ns)
        if point is not None:
            coords_elem = point.find('kml:coordinates', ns)
            if coords_elem is not None:
                coords = coords_elem.text.strip().split(',')
                geometry = {
                    "type": "Point",
                    "coordinates": [float(coords[0]), float(coords[1])]
                }
        else:
            polygon = placemark.find('.//kml:Polygon', ns)
            if polygon is not None:
                outer_boundary = polygon.find('.//kml:outerBoundaryIs/kml:LinearRing/kml:coordinates', ns)
                if outer_boundary is not None:
                    coords_text = outer_boundary.text.strip()
                    coords = []
                    for pair in coords_text.split():
                        c = pair.split(',')
                        if len(c) >= 2:
                            coords.append([float(c[0]), float(c[1])])
                    geometry = {
                        "type": "Polygon",
                        "coordinates": [coords]
                    }
        
        if geometry:
            features.append({
                "type": "Feature",
                "properties": {
                    "name": name,
                    "description": "Virtual tour video by RomanoImpero. Watch the reconstruction and history of this location.",
                    "category": "Walking Tour Video",
                    "link": youtube_link,
                    "source": "https://bio.link/romanoimpero",
                    "rights": "RomanoImpero",
                    "color": color,
                    "icon": "assets/icons/icon-video.png"
                },
                "geometry": geometry
            })
            
    return {
        "type": "FeatureCollection",
        "features": features
    }

if __name__ == "__main__":
    kml_file = "temp_kml/extracted/doc.kml"
    output_file = "data/walking_tour.json"
    
    data = parse_kml(kml_file)
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(f"Extracted {len(data['features'])} features to {output_file}")
