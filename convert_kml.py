import xml.etree.ElementTree as ET
import json
import os
import re

def clean_html(raw_html):
    if not raw_html:
        return ""
    # Remove CDATA
    cleanr = re.compile('<!\[CDATA\[(.*?)\]\]>', re.DOTALL)
    cleantext = re.sub(cleanr, r'\1', raw_html)
    # Replace <br> with newline
    cleantext = cleantext.replace('<br>', '\n').replace('<br/>', '\n')
    # Remove other HTML tags
    cleantext = re.sub('<.*?>', '', cleantext)
    return cleantext.strip()

def convert_kml_to_geojson(kml_path, output_path):
    tree = ET.parse(kml_path)
    root = tree.getroot()
    
    # KML namespace
    ns = {'kml': 'http://www.opengis.net/kml/2.2'}
    
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Map styles to icons
    style_map = {}
    for style_map_elem in root.findall('.//kml:StyleMap', ns):
        sm_id = style_map_elem.get('id')
        # Find the normal style
        normal_pair = style_map_elem.find('.//kml:Pair[kml:key="normal"]', ns)
        if normal_pair is not None:
            style_url = normal_pair.find('kml:styleUrl', ns).text.lstrip('#')
            style_map[sm_id] = style_url

    icon_map = {}
    for style_elem in root.findall('.//kml:Style', ns):
        s_id = style_elem.get('id')
        icon_href = style_elem.find('.//kml:Icon/kml:href', ns)
        if icon_href is not None:
            icon_map[s_id] = icon_href.text.replace('images/', 'assets/icons/')

    feature_id = 0
    for folder in root.findall('.//kml:Folder', ns):
        category = folder.find('kml:name', ns)
        category = category.text if category is not None else "Other"
        
        for placemark in folder.findall('kml:Placemark', ns):
            name = placemark.find('kml:name', ns)
            name = name.text if name is not None else "Unnamed"
            
            desc = placemark.find('kml:description', ns)
            desc = clean_html(desc.text) if desc is not None else ""
            
            style_url = placemark.find('kml:styleUrl', ns)
            style_url = style_url.text.lstrip('#') if style_url is not None else ""
            
            # Resolve style from StyleMap if necessary
            resolved_style = style_map.get(style_url, style_url)
            icon_path = icon_map.get(resolved_style, "")
            
            # Geometry
            point = placemark.find('.//kml:Point', ns)
            line = placemark.find('.//kml:LineString', ns)
            polygon = placemark.find('.//kml:Polygon', ns)
            
            geometry = None
            lat, lng = 0, 0
            
            if point is not None:
                coords_elem = point.find('kml:coordinates', ns)
                if coords_elem is not None:
                    coords = coords_elem.text.strip().split(',')
                    lng, lat = float(coords[0]), float(coords[1])
                    geometry = {
                        "type": "Point",
                        "coordinates": [lng, lat]
                    }
            elif line is not None:
                coords_elem = line.find('kml:coordinates', ns)
                if coords_elem is not None:
                    coords_text = coords_elem.text.strip()
                    coord_list = []
                    for pair in coords_text.split():
                        c = pair.split(',')
                        coord_list.append([float(c[0]), float(c[1])])
                    geometry = {
                        "type": "LineString",
                        "coordinates": coord_list
                    }
                    lng, lat = coord_list[0]
            elif polygon is not None:
                coords_elem = polygon.find('.//kml:coordinates', ns)
                if coords_elem is not None:
                    coords_text = coords_elem.text.strip()
                    coord_list = []
                    for pair in coords_text.split():
                        c = pair.split(',')
                        coord_list.append([float(c[0]), float(c[1])])
                    geometry = {
                        "type": "Polygon",
                        "coordinates": [coord_list]
                    }
                    lng, lat = coord_list[0]

            if geometry:
                feature = {
                    "type": "Feature",
                    "id": feature_id,
                    "geometry": geometry,
                    "properties": {
                        "id": feature_id,
                        "name": name,
                        "description": desc,
                        "category": category,
                        "icon": icon_path,
                        "lat": lat,
                        "lng": lng,
                        "isLine": line is not None or polygon is not None
                    }
                }
                geojson["features"].append(feature)
                feature_id += 1

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=4, ensure_ascii=False)
    
    print(f"Converted {feature_id} features to {output_path}")

if __name__ == "__main__":
    kml_file = "extracted_kmz/doc.kml"
    output_file = "data/roma_points.json"
    convert_kml_to_geojson(kml_file, output_file)
