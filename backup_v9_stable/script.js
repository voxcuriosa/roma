const knownPoints = {
    colosseum: { name: "Colosseum", lat: 41.8902, lng: 12.4922 },
    castel: { name: "Castel Sant'Angelo", lat: 41.9031, lng: 12.4663 },
    augustus: { name: "Mausoleum of Augustus", lat: 41.9061, lng: 12.4764 },
    circus: { name: "Circus Maximus", lat: 41.8859, lng: 12.4853 }
};

const layerInfo = {
    2: "<strong>Rodolfo Lanciani (1901)</strong><br>Forma Urbis Romae. A monumental work mapping ancient ruins onto the 19th-century city. Source: <a href='https://mappingrome.com/' target='_blank'>Mapping Rome project</a>.",
    3: "<strong>G.B. Falda (1676)</strong><br>Nova Pianta di Roma. A detailed bird's-eye view of Baroque Rome. Source: <a href='https://scholarsbank.uoregon.edu/xmlui/handle/1794/23308' target='_blank'>University of Oregon</a>.",
    4: "<strong>Giambattista Nolli (1748)</strong><br>Nuova Pianta di Roma. The first accurate ground-plan map of the city. Source: <a href='http://nolli.uoregon.edu/' target='_blank'>Nolli Map Website</a>."
};

// Historical Glimpse Data (Piranesi & Old Photos)
const historicalGlimpses = [
    {
        title: "The Colosseum (Veduta del Colosseo)",
        artist: "Giovanni Battista Piranesi (1776)",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Piranesi-16035.jpg/1200px-Piranesi-16035.jpg",
        description: "A dramatic etching showing the inner amphitheater in its romantic, ruined state before modern excavations. Piranesi's work helped define the 18th-century European imagination of Ancient Rome.",
        lat: 41.8902, lng: 12.4922,
        category: "Antique Etching",
        layer: 3
    },
    {
        title: "The Pantheon",
        artist: "Historical Photograph (c. 1890)",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Pantheon_Rome_1890s.jpg/1200px-Pantheon_Rome_1890s.jpg",
        description: "A rare view of the Pantheon's portico in the late 19th century. Note the absence of modern traffic and the historical buildings surrounding the Piazza della Rotonda.",
        lat: 41.8986, lng: 12.4769,
        category: "19th Century Photography",
        layer: 2
    },
    {
        title: "Castel Sant'Angelo",
        artist: "Giovanni Battista Piranesi",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Giovanni_Battista_Piranesi_-_Castel_Sant%27Angelo.jpg/1200px-Giovanni_Battista_Piranesi_-_Castel_Sant%27Angelo.jpg",
        description: "Hadrian's Mausoleum reimagined as a papal fortress. The Ponte Sant'Angelo is shown with its iconic statues, framed by the Tiber river.",
        lat: 41.9031, lng: 12.4663,
        category: "Renaissance Architecture",
        layer: 3
    },
    {
        title: "The Forum Romanum",
        artist: "J.M.W. Turner (1833)",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/J._M._W._Turner_-_The_Forum_Romanum%2C_for_Mr._Rogers%27s_Italy_-_Google_Art_Project.jpg/1200px-J._M._W._Turner_-_The_Forum_Romanum%2C_for_Mr._Rogers%27s_Italy_-_Google_Art_Project.jpg",
        description: "A watercolor masterpiece capturing the light and desolation of the Forum during the Grand Tour era. This view looks towards the Arch of Titus.",
        lat: 41.8925, lng: 12.4853,
        category: "Grand Tour Art",
        layer: 2
    },
    {
        title: "Piazza Navona",
        artist: "Historical View (c. 1895)",
        image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Rome_Piazza_Navona_1890s.jpg/1200px-Rome_Piazza_Navona_1890s.jpg",
        description: "Built on the ruins of the Stadium of Domitian, Piazza Navona is seen here in its quiet, pre-modern glory with the Fountain of the Four Rivers center stage.",
        lat: 41.8992, lng: 12.4731,
        category: "City Life",
        layer: 4
    }
];

let map, pointsData = [], markers = [];
let lancianiLayer, faldaLayer, nolliLayer, satelliteLayer, topoLayer;
let userMarker, lastUserLatLng, isFollowingUser = false;

// Custom Measurement State
let isMeasuring = false;
let measurePoints = [];
let measureMarkers = [];
let measureLine = null;
let tempLine = null;
let measureArea = null;

function initMap() {
    satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: 'Google Satellite' });
    topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap' });

    // Lanciani Tiles (Recursive Load)
    const lParts = [];
    const minLat = 41.8704, maxLat = 41.9136, minLng = 12.4403, maxLng = 12.5266;
    const latStep = (maxLat - minLat) / 4, lngStep = (maxLng - minLng) / 4;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const b = [[maxLat - (r + 1) * latStep, minLng + c * lngStep], [maxLat - r * latStep, minLng + (c + 1) * lngStep]];
            const part = L.imageOverlay(`lanciani_v5_${r}_${c}.webp?v=1`, b);
            part.on('load', checkAllLoaded);
            lParts.push(part);
        }
    }
    lancianiLayer = L.layerGroup(lParts);

    // Falda (Distortable)
    const faldaCorners = [
        L.latLng(41.92111959572856, 12.50420093536377),
        L.latLng(41.87572834776342, 12.522311210632326),
        L.latLng(41.91115609024473, 12.43459224700928),
        L.latLng(41.86077188073308, 12.457165718078615)
    ];
    faldaLayer = L.distortableImageOverlay('assets/falda.jpg', {
        corners: faldaCorners, opacity: 1, editable: false, mode: 'lock'
    });
    faldaLayer.on('load', () => hideLoader());

    nolliLayer = L.tileLayer('https://stacks.stanford.edu/file/nn217br6628/{z}/{x}/{y}.png', { attribution: 'Nolli 1748' });
    nolliLayer.on('loading', () => showLoader());
    nolliLayer.on('load', () => hideLoader());

    map = L.map('map', {
        center: [41.8902, 12.4922], zoom: 16,
        layers: [satelliteLayer], zoomControl: false
    });

    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    map.on('locationfound', onLocationFound);
    map.on('locationerror', () => { 
        isFollowingUser = false; 
        document.getElementById('gps-btn').classList.remove('active');
    });

    const slider = document.getElementById('opacity-slider');
    const valSpan = document.getElementById('opacity-value');
    slider.oninput = (e) => {
        const v = e.target.value / 100;
        valSpan.textContent = `${e.target.value}%`;
        [lancianiLayer, faldaLayer, nolliLayer].forEach(l => {
            if (map.hasLayer(l)) {
                if (l.setOpacity) l.setOpacity(v);
                else if (l.eachLayer) l.eachLayer(part => part.setOpacity && part.setOpacity(v));
            }
        });
    };

    fetchData();
    setupLayersMenu();
    setupEventListeners();
    displayDailyGlimpse();
}

// HISTORICAL GLIMPSE LOGIC
function displayDailyGlimpse() {
    const glimpse = historicalGlimpses[Math.floor(Math.random() * historicalGlimpses.length)];
    const container = document.getElementById('daily-glimpse-container');

    container.innerHTML = `
        <img src="${glimpse.image}" class="glimpse-img" alt="${glimpse.title}">
        <div class="glimpse-info">
            <strong>${glimpse.title}</strong>
            <span>${glimpse.artist}</span>
        </div>
    `;

    container.onclick = () => {
        setMapLayer(glimpse.layer);
        map.flyTo([glimpse.lat, glimpse.lng], 17, { animate: true, duration: 2 });
        showDetails({
            title: glimpse.title,
            category: glimpse.category,
            description: glimpse.description,
            image: glimpse.image
        });
    };
}

// CUSTOM MEASUREMENT LOGIC
function toggleMeasureMode() {
    isMeasuring = !isMeasuring;
    const btn = document.getElementById('measure-btn');
    const toast = document.getElementById('measure-hint');

    if (isMeasuring) {
        btn.classList.add('active');
        toast.style.display = 'flex';
        clearMeasurement();
        map.on('click', handleMeasureClick);
        map.on('mousemove', handleMeasureMove);
        map.on('dblclick', handleMeasureDblClick);
        lockMap(true);
    } else {
        btn.classList.remove('active');
        toast.style.display = 'none';
        map.off('click', handleMeasureClick);
        map.off('mousemove', handleMeasureMove);
        map.off('dblclick', handleMeasureDblClick);
        lockMap(false);
    }
}

function handleMeasureClick(e) {
    const latlng = e.latlng;
    measurePoints.push(latlng);

    const marker = L.circleMarker(latlng, {
        radius: 6, color: '#f39c12', fillColor: '#000', fillOpacity: 1, weight: 3, interactive: false
    }).addTo(map);
    measureMarkers.push(marker);

    if (measurePoints.length > 1) {
        if (!measureLine) {
            measureLine = L.polyline(measurePoints, { color: '#f39c12', weight: 4, dashArray: '8, 12', opacity: 0.9, interactive: false }).addTo(map);
        } else {
            measureLine.setLatLngs(measurePoints);
        }

        if (measurePoints.length >= 3) {
            if (!measureArea) {
                measureArea = L.polygon(measurePoints, { color: '#f39c12', weight: 0, fillColor: '#f39c12', fillOpacity: 0.2, interactive: false }).addTo(map);
            } else {
                measureArea.setLatLngs(measurePoints);
            }
        }

        let totalDist = 0;
        for (let i = 0; i < measurePoints.length - 1; i++) {
            totalDist += measurePoints[i].distanceTo(measurePoints[i+1]);
        }

        const area = calculateArea(measurePoints);
        const formatDist = (d) => d > 1000 ? (d/1000).toFixed(2) + ' km' : Math.round(d) + ' m';
        const formatArea = (a) => a > 1000000 ? (a/1000000).toFixed(2) + ' km²' : Math.round(a) + ' m²';

        let resultHTML = `<strong>Total: ${formatDist(totalDist)}</strong>`;
        if (area > 0 && measurePoints.length >= 3) {
            resultHTML += `<br><span style="color:#f39c12; font-size:11px;">Area: ${formatArea(area)}</span>`;
        }

        marker.bindTooltip(resultHTML, {
            permanent: true, direction: 'right', className: 'measure-tooltip', offset: [10, 0]
        }).openTooltip();
    }
}

function handleMeasureMove(e) {
    if (!isMeasuring || measurePoints.length === 0) return;
    const latlng = e.latlng;
    const lastPoint = measurePoints[measurePoints.length - 1];

    if (!tempLine) {
        tempLine = L.polyline([lastPoint, latlng], { color: '#f39c12', weight: 2, opacity: 0.5, dashArray: '5, 5', interactive: false }).addTo(map);
    } else {
        tempLine.setLatLngs([lastPoint, latlng]);
    }
}

function handleMeasureDblClick() {
    if (!isMeasuring) return;
    toggleMeasureMode();
}

function calculateArea(latlngs) {
    if (latlngs.length < 3) return 0;
    const radius = 6378137;
    let area = 0;
    for (let i = 0; i < latlngs.length; i++) {
        const p1 = latlngs[i];
        const p2 = latlngs[(i + 1) % latlngs.length];
        area += (p2.lng - p1.lng) * Math.PI / 180 * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
    }
    return Math.abs(area * radius * radius / 2.0);
}

function clearMeasurement() {
    if (measureLine) map.removeLayer(measureLine);
    if (tempLine) map.removeLayer(tempLine);
    if (measureArea) map.removeLayer(measureArea);
    measureMarkers.forEach(m => map.removeLayer(m));
    measurePoints = [];
    measureMarkers = [];
    measureLine = null;
    tempLine = null;
    measureArea = null;
}

function lockMap(lock) {
    if (lock) {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
    } else {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
    }
}

function onLocationFound(e) {
    lastUserLatLng = e.latlng;
    if (!userMarker) {
        const pulse = L.divIcon({ className: 'user-location-pulse', iconSize: [14, 14], iconAnchor: [7, 7] });
        const dot = L.divIcon({ className: 'user-location-dot', iconSize: [14, 14], iconAnchor: [7, 7] });
        L.marker(e.latlng, { icon: pulse, zIndexOffset: 999 }).addTo(map);
        userMarker = L.marker(e.latlng, { icon: dot, zIndexOffset: 1000 }).addTo(map);
    } else {
        userMarker.setLatLng(e.latlng);
    }
    if (isFollowingUser) map.setView(e.latlng, map.getZoom());
}

function toggleGPS() {
    const btn = document.getElementById('gps-btn');
    if (!isFollowingUser) {
        isFollowingUser = true;
        btn.classList.add('active');
        map.locate({ watch: true, enableHighAccuracy: true });
        if (lastUserLatLng) map.setView(lastUserLatLng, map.getZoom());
    } else {
        isFollowingUser = false;
        btn.classList.remove('active');
    }
}

function setupEventListeners() {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('toggle-sidebar');
    toggleBtn.onclick = () => {
        sidebar.classList.toggle('collapsed');
        toggleBtn.querySelector('i').classList.toggle('fa-chevron-left');
        toggleBtn.querySelector('i').classList.toggle('fa-chevron-right');
        setTimeout(() => { map.invalidateSize(); }, 400);
    };

    document.getElementById('zoom-in').onclick = () => map.zoomIn();
    document.getElementById('zoom-out').onclick = () => map.zoomOut();
    document.getElementById('gps-btn').onclick = () => toggleGPS();
    document.getElementById('measure-btn').onclick = () => toggleMeasureMode();
    document.getElementById('layers-btn').onclick = (e) => { 
        e.stopPropagation();
        document.getElementById('layers-menu').classList.toggle('show'); 
    };

    document.getElementById('close-modal').onclick = () => document.getElementById('detail-modal').style.display = 'none';

    document.getElementById('search-input').oninput = (e) => {
        const t = e.target.value.toLowerCase();
        document.querySelectorAll('.location-item').forEach(i => i.style.display = i.textContent.toLowerCase().includes(t) ? 'flex' : 'none');
    };

    map.on('click', () => {
        document.getElementById('layers-menu').classList.remove('show');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isMeasuring) toggleMeasureMode();
            clearMeasurement();
        }
    });
}

let loadedPartsCount = 0;
function checkAllLoaded() {
    loadedPartsCount++;
    if (map.hasLayer(lancianiLayer) && loadedPartsCount >= 16) hideLoader();
}

function showLoader() { document.getElementById('map-loader').style.display = 'flex'; }
function hideLoader() { document.getElementById('map-loader').style.display = 'none'; }

function setMapLayer(index) {
    const histLayers = [lancianiLayer, faldaLayer, nolliLayer, topoLayer];
    histLayers.forEach(l => { if (map.hasLayer(l)) map.removeLayer(l); });

    loadedPartsCount = 0;
    if (index >= 2) showLoader();

    if (index === 0) {
        if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
        hideLoader();
    } else if (index === 1) {
        topoLayer.addTo(map);
        hideLoader();
    } else {
        if (!map.hasLayer(satelliteLayer)) satelliteLayer.addTo(map);
        const layers = [null, null, lancianiLayer, faldaLayer, nolliLayer];
        layers[index].addTo(map);
        
        const v = document.getElementById('opacity-slider').value / 100;
        const l = layers[index];
        if (l.setOpacity) l.setOpacity(v);
        else if (l.eachLayer) l.eachLayer(p => p.setOpacity && p.setOpacity(v));
    }

    const attrBox = document.getElementById('layer-attribution');
    if (layerInfo[index]) {
        attrBox.innerHTML = layerInfo[index];
        attrBox.style.display = 'block';
    } else {
        attrBox.style.display = 'none';
    }

    document.getElementById('opacity-control').style.display = (index >= 2) ? 'block' : 'none';
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    document.querySelector(`.menu-item[data-layer="${index}"]`).classList.add('active');
}

async function fetchData() {
    try {
        const res = await fetch('data/roma_points.json');
        const d = await res.json();
        pointsData = d.features.filter(f => f.geometry && f.geometry.type === 'Point').map(f => ({
            ...f.properties, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], title: f.properties.name
        }));
        updateMarkers();
    } catch (e) { console.error(e); }
}

function updateMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    const list = document.getElementById('locations-list');
    list.innerHTML = '';
    pointsData.forEach(p => {
        const m = L.marker([p.lat, p.lng], { icon: L.icon({ iconUrl: p.icon || 'assets/icons/icon-1.png', iconSize: [32, 32] }) }).addTo(map);
        m.on('click', () => showDetails(p));
        markers.push(m);
        const item = document.createElement('div');
        item.className = 'location-item';
        item.innerHTML = `
            <img src="${p.icon || 'assets/icons/icon-1.png'}" style="width: 24px;">
            <div class="location-info"><h3>${p.title}</h3><span class="category-small">${p.category}</span></div>
        `;
        item.onclick = () => { map.flyTo([p.lat, p.lng], 18); showDetails(p); };
        list.appendChild(item);
    });
}

function showDetails(p) {
    document.getElementById('modal-title').textContent = p.title;
    document.getElementById('modal-category').textContent = p.category;
    document.getElementById('modal-description').textContent = p.description || "Details pending...";
    
    const imgWrapper = document.getElementById('modal-image-container');
    const modalImg = document.getElementById('modal-image');
    if (p.image) {
        modalImg.src = p.image;
        imgWrapper.style.display = 'block';
    } else {
        imgWrapper.style.display = 'none';
    }
    
    document.getElementById('detail-modal').style.display = 'flex';
}

function setupLayersMenu() {
    document.querySelectorAll('.menu-item').forEach(i => i.onclick = () => { 
        setMapLayer(parseInt(i.dataset.layer)); 
        document.getElementById('layers-menu').classList.remove('show'); 
    });
}

window.onload = initMap;
 d
