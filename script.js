const knownPoints = {
    colosseum: { name: "Colosseum", lat: 41.8902, lng: 12.4922 },
    castel: { name: "Castel Sant'Angelo", lat: 41.9031, lng: 12.4663 },
    augustus: { name: "Mausoleum of Augustus", lat: 41.9061, lng: 12.4764 },
    circus: { name: "Circus Maximus", lat: 41.8859, lng: 12.4853 }
};

const layerInfo = {
    2: "<strong>Rodolfo Lanciani (1901)</strong><br>Forma Urbis Romae. A monumental work mapping ancient ruins onto the 19th-century city. Source: <a href='https://mappingrome.com/' target='_blank'>Mapping Rome project</a>.",
    3: "<strong>G.B. Falda (1676)</strong><br>Nova Pianta di Roma. A detailed bird's-eye view of Baroque Rome. Source: <a href='https://scholarsbank.uoregon.edu/xmlui/handle/1794/23308' target='_blank'>University of Oregon</a>.",
    4: "<strong>Giambattista Nolli (1748)</strong><br>Nuova Pianta di Roma. The first accurate ground-plan map of the city. Source: <a href='http://nolli.uoregon.edu/' target='_blank'>Nolli Map Website</a>.",
    6: "<strong>Heinrich Kiepert (1892)</strong><br>Roma urbs ab Augusti Imp. tempore. A scholarly reconstruction of Imperial Rome. Source: <a href='https://www.davidrumsey.com/luna/servlet/detail/RUMSEY~8~1~23555~850020' target='_blank'>David Rumsey Collection</a>.",
    5: "<strong>Samuel Ball Platner (1911)</strong><br>Ancient Rome. From 'The Topography and Monuments of Ancient Rome'. Source: <a href='https://commons.wikimedia.org/w/index.php?curid=954235' target='_blank'>Wikimedia (Public Domain)</a>."
};

// Historical Glimpse Data (Piranesi & Old Photos)
const historicalGlimpses = [
    {
        title: "The Colosseum (Veduta dell'Anfiteatro Flavio)",
        artist: "Giovanni Battista Piranesi (1776)",
        image: "assets/historical/colosseum.jpg",
        description: "A dramatic etching showing the inner amphitheater in its romantic, ruined state before modern excavations. Piranesi's work helped define the 18th-century European imagination of Ancient Rome.",
        lat: 41.8902, lng: 12.4922,
        category: "Antique Etching",
        layer: 3
    },
    {
        title: "The Pantheon",
        artist: "Giovanni Battista Piranesi (1761)",
        image: "assets/historical/pantheon.jpg",
        description: "A rare view of the Pantheon's exterior in the late 18th century. Note the atmospheric rendering of the Piazza della Rotonda and the scale of the ancient columns.",
        lat: 41.8986, lng: 12.4769,
        category: "Antique Etching",
        layer: 3
    },
    {
        title: "Castel Sant'Angelo",
        artist: "Giovanni Battista Piranesi (1756)",
        image: "assets/historical/castel.jpg",
        description: "Hadrian's Mausoleum reimagined as a papal fortress. The Ponte Sant'Angelo is shown with its iconic statues, framed by the Tiber river.",
        lat: 41.9031, lng: 12.4663,
        category: "Antique Etching",
        layer: 3
    },
    {
        title: "The Forum Romanum",
        artist: "Giovanni Battista Piranesi (1775)",
        image: "assets/historical/forum.jpg",
        description: "A masterpiece capturing the light and desolation of the Forum (Campo Vaccino) during the 18th century. This view shows the ruins of the Forum of Augustus.",
        lat: 41.8925, lng: 12.4853,
        category: "Antique Etching",
        layer: 3
    },
    {
        title: "Piazza Navona",
        artist: "Giovanni Battista Piranesi (1751)",
        image: "assets/historical/navona.jpg",
        description: "Built on the ruins of the Stadium of Domitian, Piazza Navona is seen here in its quiet, pre-modern glory with the Fountain of the Four Rivers center stage.",
        lat: 41.8992, lng: 12.4731,
        category: "Antique Etching",
        layer: 3
    }
];

let map, pointsData = [], walkingTourData = [], markers = [], polygons = [];
let activeLayerIndex = 0;
let piranesiMetadata = [];
let vintageMetadata = [];
let satelliteLayer, topoLayer, lancianiLayer, faldaLayer, nolliLayer, platnerLayer, kiepertLayer;
let userMarker, lastUserLatLng, isFollowingUser = false;
let selectedCategory = "";
let showAllPoints = true;
let customCorners = {};

// Custom Measurement State
let isMeasuring = false;
let measurePoints = [];
let measureMarkers = [];
let measureLine = null;
let tempLine = null;
let measureArea = null;

function updateURL() {
    if (!map) return;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const hash = `#layer=${activeLayerIndex}&lat=${center.lat.toFixed(5)}&lng=${center.lng.toFixed(5)}&z=${zoom}`;
    window.history.replaceState(null, null, hash);
}

function readURL() {
    const hash = window.location.hash.substring(1);
    if (!hash) return false;
    const params = new URLSearchParams(hash.replace(/&/g, '\n').replace(/=/g, ' '));
    const layer = parseInt(hash.match(/layer=(\d+)/)?.[1]);
    const lat = parseFloat(hash.match(/lat=([\d.-]+)/)?.[1]);
    const lng = parseFloat(hash.match(/lng=([\d.-]+)/)?.[1]);
    const z = parseInt(hash.match(/z=(\d+)/)?.[1]);
    
    if (!isNaN(layer)) setMapLayer(layer);
    if (!isNaN(lat) && !isNaN(lng) && !isNaN(z)) {
        map.setView([lat, lng], z);
    }
    return true;
}

async function initMap() {
    // MOBILE DEFAULT: Collapse sidebar BEFORE map init if screen is narrow
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('collapsed');
    }

    // Load custom corners from georef tool
    try {
        const res = await fetch('published_maps.json?v=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            data.forEach(m => {
                customCorners[m.imagePath] = m.corners;
            });
        }
    } catch (e) { console.log("No custom corners found."); }

    satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { attribution: 'Google Satellite' });
    topoLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { attribution: 'OpenTopoMap' });

    // Lanciani will be lazy-loaded in setMapLayer
    lancianiLayer = L.layerGroup();

    nolliLayer = L.tileLayer('https://stacks.stanford.edu/file/nn217br6628/{z}/{x}/{y}.png', { attribution: 'Nolli 1748' });
    nolliLayer.on('loading', () => showLoader());
    nolliLayer.on('load', () => hideLoader());

    map = L.map('map-container', {
        center: [41.8902, 12.4922], zoom: 16,
        layers: [satelliteLayer], zoomControl: false,
        maxZoom: 22
    });

    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

    map.on('moveend', updateURL);
    map.on('zoomend', updateURL);

    // Show loader on zoom if using tiled layers
    map.on('zoomstart', () => {
        if (activeLayerIndex > 1) {
            showLoader();
        }
    });

    const mapSlider = document.getElementById('map-opacity-slider');
    if (mapSlider) {
        L.DomEvent.disableClickPropagation(mapSlider);
        L.DomEvent.disableScrollPropagation(mapSlider);
        mapSlider.oninput = (e) => {
            const v = e.target.value / 100;
            [lancianiLayer, faldaLayer, nolliLayer, platnerLayer, kiepertLayer].forEach(l => {
                if (l && map.hasLayer(l)) {
                    if (l.setOpacity) l.setOpacity(v);
                    else if (l.eachLayer) l.eachLayer(part => part.setOpacity && part.setOpacity(v));
                }
            });
        };
    }

    readURL();
    fetchData();
    setupLayersMenu();
    setupEventListeners();
    displayDailyGlimpse();

    // Fix for the "grey area" issue on mobile/resize
    const resizeObserver = new ResizeObserver(() => {
        if (map) map.invalidateSize();
    });
    resizeObserver.observe(document.getElementById('map-container'));

    document.getElementById('sidebar').addEventListener('transitionend', () => {
        if (map) map.invalidateSize();
    });

    map.on('zoomend', () => {
        setTimeout(() => map.invalidateSize(), 100);
    });

    // Ensure Leaflet calculates size correctly after potential mobile collapse
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 500);
}

// HISTORICAL GLIMPSE LOGIC
function displayDailyGlimpse() {
    // Pick from the expanded collection
    const allHistorical = [...historicalGlimpses];
    if (piranesiMetadata.length > 0) {
        // Sample 5 random ones from Piranesi to mix in
        for (let i = 0; i < 5; i++) {
            const pm = piranesiMetadata[Math.floor(Math.random() * piranesiMetadata.length)];
            allHistorical.push({
                title: pm.title.split(',')[0].split(' (')[0],
                artist: "G.B. Piranesi",
                image: pm.image,
                description: pm.title,
                lat: 41.8902, lng: 12.4922,
                layer: 3
            });
        }
    }

    const glimpse = allHistorical[Math.floor(Math.random() * allHistorical.length)];
    const container = document.getElementById('daily-glimpse-container');

    container.innerHTML = `
        <img src="${glimpse.image}" class="glimpse-img" alt="${glimpse.title}">
        <div class="glimpse-info">
            <strong>${glimpse.title}</strong>
            <span>${glimpse.artist}</span>
        </div>
    `;

    container.onclick = () => {
        setMapLayer(glimpse.layer || 3);
        map.flyTo([glimpse.lat, glimpse.lng], 17, { animate: true, duration: 2 });
        showDetails({
            title: glimpse.title,
            category: "Historical Highlight",
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

    document.getElementById('search-input').oninput = () => {
        updateMarkers();
    };

    document.getElementById('category-select').onchange = (e) => {
        selectedCategory = e.target.value;
        if (selectedCategory) {
            showAllPoints = false;
            document.getElementById('show-all-toggle').checked = false;
        }
        updateMarkers();
    };

    document.getElementById('show-all-toggle').onchange = (e) => {
        showAllPoints = e.target.checked;
        if (showAllPoints) {
            selectedCategory = "";
            document.getElementById('category-select').value = "";
        }
        updateMarkers();
    };

    map.on('click', () => {
        document.getElementById('layers-menu').classList.remove('show');
    });

    document.getElementById('mobile-sidebar-overlay').onclick = () => {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggle-sidebar');
        sidebar.classList.add('collapsed');
        toggleBtn.querySelector('i').className = 'fas fa-chevron-right';
    };

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (isMeasuring) toggleMeasureMode();
            clearMeasurement();
            document.getElementById('about-modal').style.display = 'none';
        }
    });

    // About Modal Triggers
    const aboutBtn = document.getElementById('about-me-btn');
    const headerAboutBtn = document.getElementById('header-about-trigger');
    const aboutModal = document.getElementById('about-modal');
    const closeAbout = document.getElementById('close-about');

    const openAbout = () => {
        aboutModal.style.display = 'flex';
        document.getElementById('layers-menu').classList.remove('show');
    };

    if (aboutBtn) aboutBtn.onclick = openAbout;
    if (headerAboutBtn) headerAboutBtn.onclick = openAbout;
    if (closeAbout) closeAbout.onclick = () => aboutModal.style.display = 'none';

    window.onclick = (e) => {
        if (e.target === aboutModal) aboutModal.style.display = 'none';
        if (e.target === document.getElementById('detail-modal')) document.getElementById('detail-modal').style.display = 'none';
        if (!e.target.closest('.layers-container')) {
            document.getElementById('layers-menu').classList.remove('show');
        }
    };
}

let loadedPartsCount = 0;
function checkAllLoaded() {
    loadedPartsCount++;
    if (map.hasLayer(lancianiLayer) && loadedPartsCount >= 16) hideLoader();
}

function showLoader() { 
    document.getElementById('map-status-toast').style.display = 'flex'; 
    // SAFETY TIMEOUT: Always hide after 12 seconds for large maps
    setTimeout(hideLoader, 12000);
}
function hideLoader() { document.getElementById('map-status-toast').style.display = 'none'; }

function loadLanciani() {
    if (lancianiLayer.getLayers().length > 0) return; // Already loaded

    const minLat = 41.8704, maxLat = 41.9136, minLng = 12.4403, maxLng = 12.5266;
    const latStep = (maxLat - minLat) / 4, lngStep = (maxLng - minLng) / 4;
    
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const b = [[maxLat - (r + 1) * latStep, minLng + c * lngStep], [maxLat - r * latStep, minLng + (c + 1) * lngStep]];
            const part = L.imageOverlay(`lanciani_v5_${r}_${c}.webp?v=1`, b);
            part.on('load', checkAllLoaded);
            lancianiLayer.addLayer(part);
        }
    }
}

function setMapLayer(index) {
    console.log("--- setMapLayer called with index:", index, "---");
    
    // Update menu UI
    document.querySelectorAll('.menu-item').forEach(i => {
        const itemLayer = parseInt(i.dataset.layer);
        i.classList.toggle('active', itemLayer === index);
    });

    // Remove ALL historical/extra layers first
    const allHist = [lancianiLayer, faldaLayer, nolliLayer, platnerLayer, kiepertLayer, topoLayer];
    allHist.forEach(l => { if (l && map.hasLayer(l)) map.removeLayer(l); });

    activeLayerIndex = index;
    let l = null;

    if (index === 0) {
        map.addLayer(satelliteLayer);
    } else if (index === 1) {
        map.addLayer(topoLayer);
    } else if (index === 2) {
        l = lancianiLayer;
        loadLanciani();
    } else if (index === 3) {
        if (faldaLayer) map.removeLayer(faldaLayer);
        const url = 'assets/falda/falda.jpg';
        const corners = customCorners[url] || [
            L.latLng(41.92111959572856, 12.50420093536377),
            L.latLng(41.87572834776342, 12.522311210632326),
            L.latLng(41.91115609024473, 12.43459224700928),
            L.latLng(41.86077188073308, 12.457165718078615)
        ];
        faldaLayer = L.distortableImageOverlay(url, {
            corners: corners,
            opacity: 1, editable: false, mode: 'lock'
        }).on('load', () => hideLoader());
        l = faldaLayer;
    } else if (index === 4) {
        l = nolliLayer;
    } else if (index === 5) {
        if (platnerLayer) map.removeLayer(platnerLayer);
        const url = 'assets/Platner/The_Topography_and_Monuments_of_Ancient_Rome.jpg';
        const corners = customCorners[url] || [
            L.latLng(41.91543547867898, 12.444505691528322),
            L.latLng(41.91505226156054, 12.52372741699219),
            L.latLng(41.87103086005411, 12.443218231201172),
            L.latLng(41.87147825471, 12.526044845581056)
        ];
        platnerLayer = L.distortableImageOverlay(url, {
            corners: corners,
            opacity: 1, editable: false, mode: 'lock'
        }).on('load', () => hideLoader());
        l = platnerLayer;
    } else if (index === 6) {
        if (kiepertLayer) map.removeLayer(kiepertLayer);
        const url = 'assets/Kiepert/11690011.jpg';
        const corners = customCorners[url] || [
            L.latLng(41.92629234083705, 12.437210083007814),
            L.latLng(41.923993394784745, 12.52896308898926),
            L.latLng(41.82928155978289, 12.437896728515625),
            L.latLng(41.82992111131576, 12.528877258300783)
        ];
        kiepertLayer = L.distortableImageOverlay(url, {
            corners: corners,
            opacity: 1, editable: false, mode: 'lock'
        }).on('load', () => hideLoader());
        l = kiepertLayer;
    }

    if (l) {
        console.log("Adding layer object to map:", l);
        showLoader();
        map.addLayer(l);
        
        // Safety: If it's already loaded or doesn't fire 'load', hide after 2s
        setTimeout(hideLoader, 2000);
    }

    // Apply current opacity
    const v = document.getElementById('map-opacity-slider').value / 100;
    if (l) {
        if (l.setOpacity) l.setOpacity(v);
        else if (l.eachLayer) l.eachLayer(p => p.setOpacity && p.setOpacity(v));
    }

    // Attribution
    const attrBox = document.getElementById('custom-attribution');
    if (layerInfo[index]) {
        attrBox.innerHTML = layerInfo[index];
        attrBox.style.display = 'block';
    } else {
        attrBox.style.display = 'none';
    }

    // Slider visibility
    const opacityTool = document.querySelector('.opacity-tool-group');
    if (index >= 2) {
        opacityTool.style.display = 'flex';
    } else {
        opacityTool.style.display = 'none';
    }

    updateURL();
}

async function fetchData() {
    try {
        const pRes = await fetch('data/piranesi_metadata.json');
        piranesiMetadata = await pRes.json();

        try {
            const vRes = await fetch('data/vintage_metadata.json');
            vintageMetadata = await vRes.json();
        } catch(e) { console.warn("Vintage metadata not yet ready."); }

        const res = await fetch('data/roma_points.json');
        const d = await res.json();
        pointsData = d.features.filter(f => f.geometry && f.geometry.type === 'Point').map(f => ({
            ...f.properties, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], title: f.properties.name, geometry: f.geometry
        }));

        try {
            const wRes = await fetch('data/walking_tour.json');
            const wData = await wRes.json();
            walkingTourData = wData.features.map(f => ({
                ...f.properties, 
                title: f.properties.name,
                geometry: f.geometry,
                // For points, we set lat/lng directly for ease of use in markers
                lat: f.geometry.type === 'Point' ? f.geometry.coordinates[1] : null,
                lng: f.geometry.type === 'Point' ? f.geometry.coordinates[0] : null
            }));
        } catch(e) { console.warn("Walking tour data not found."); }
        
        updateMarkers();
        populateCategoryDropdown();
        setupAlbum();
        displayDailyGlimpse();
    } catch (e) { console.error(e); }
}

function populateCategoryDropdown() {
    const select = document.getElementById('category-select');
    if (!select) return;

    // Get unique categories from both sources
    const allCategories = [
        ...pointsData.map(p => p.category),
        ...walkingTourData.map(p => p.category),
        ...historicalGlimpses.map(g => g.category)
    ];
    const categories = [...new Set(allCategories)].filter(Boolean).sort();
    
    // Clear existing (except first)
    select.innerHTML = '<option value="">All Categories</option>';
    
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function updateMarkers() {
    markers.forEach(m => map.removeLayer(m));
    polygons.forEach(p => map.removeLayer(p));
    markers = [];
    polygons = [];
    const list = document.getElementById('locations-list');
    list.innerHTML = '';
    
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';

    // Combine pointsData with historicalGlimpses and walkingTourData
    const allPoints = [
        ...pointsData,
        ...walkingTourData,
        ...historicalGlimpses.map(g => ({ ...g, isHistorical: true }))
    ];

    allPoints.forEach(p => {
        // --- FILTER LOGIC ---
        let visible = true;

        if (!showAllPoints) {
            visible = false;
            if (selectedCategory && p.category === selectedCategory) visible = true;
            if (searchTerm && p.title.toLowerCase().includes(searchTerm)) visible = true;
        } else {
            if (searchTerm && !p.title.toLowerCase().includes(searchTerm)) visible = false;
        }

        if (!visible) return;

        let markerPos;
        if (p.geometry && p.geometry.type === 'Polygon') {
            // Swap coordinates for Leaflet [[lat, lng], ...]
            const leafletCoords = p.geometry.coordinates[0].map(c => [c[1], c[0]]);
            const poly = L.polygon(leafletCoords, {
                color: p.color || '#ff0000',
                fillColor: 'transparent',
                fillOpacity: 0,
                weight: 2
            }).addTo(map);
            poly.on('click', () => showDetails(p));
            polygons.push(poly);
            
            // For the list and marker interaction, use the polygon center
            const bounds = poly.getBounds();
            markerPos = bounds.getCenter();
        } else {
            markerPos = [p.lat, p.lng];
        }

        let markerIcon;
        if (p.category === 'Walking Tour Video') {
            markerIcon = L.icon({ 
                iconUrl: 'assets/icons/icon-video-v4.png', 
                iconSize: [32, 32] 
            });
        } else {
            markerIcon = L.icon({ 
                iconUrl: p.isHistorical ? 'assets/icons/icon-7.png' : (p.icon || 'assets/icons/icon-1.png'), 
                iconSize: [32, 32] 
            });
        }

        const m = L.marker(markerPos, { icon: markerIcon }).addTo(map);
        m.on('click', () => showDetails(p));
        markers.push(m);

        const item = document.createElement('div');
        item.className = 'location-item';
        
        let iconHTML;
        if (p.category === 'Walking Tour Video') {
            iconHTML = `<img src="assets/icons/icon-video-v4.png" style="width: 24px;">`;
        } else {
            iconHTML = `<img src="${p.icon || 'assets/icons/icon-1.png'}" style="width: 24px;">`;
        }

        item.innerHTML = `
            ${iconHTML}
            <div class="location-info"><h3>${p.title}</h3><span class="category-small">${p.category}</span></div>
        `;
        item.onclick = () => { 
            map.flyTo(markerPos, 18); 
            showDetails(p); 
        };
        list.appendChild(item);
    });
}

function showDetails(p) {
    document.getElementById('modal-title').textContent = p.title;
    document.getElementById('modal-category').textContent = p.category || "Historical Asset";
    document.getElementById('modal-description').textContent = p.description || "Details pending...";
    
    // Attribution and Source
    const credit = document.getElementById('modal-credit');
    const rights = document.getElementById('modal-rights');
    const linkContainer = document.getElementById('modal-link-container');
    const sourceLink = document.getElementById('modal-source-link');

    credit.textContent = p.source || "Historical Archive";
    rights.textContent = p.rights || "Public Domain / Open Access";
    
    if (p.link) {
        sourceLink.href = p.link;
        linkContainer.style.display = 'block';
    } else {
        linkContainer.style.display = 'none';
    }

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


// Telemetry Integration
async function logVisit() {
    try {
        // Prevent spam
        const lastVisit = sessionStorage.getItem('last_visit_ts');
        const now = Date.now();
        if (lastVisit && (now - lastVisit < 5000)) return;
        sessionStorage.setItem('last_visit_ts', now);

        // Country detection
        let currentCountry = 'Unknown';
        try {
            const geoRes = await fetch('https://get.geojs.io/v1/ip/country.json', { cache: "force-cache" });
            if (geoRes.ok) {
                const geoData = await geoRes.json();
                if (geoData && geoData.country) {
                    currentCountry = geoData.country;
                }
            }
        } catch (e) {
            try {
                const fallbackRes = await fetch('https://api.country.is/', { cache: "force-cache" });
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData && fallbackData.country) {
                        currentCountry = fallbackData.country;
                    }
                }
            } catch (fbErr) {
                console.warn("Geoloc failed", fbErr);
            }
        }

        const url = 'https://voxcuriosa.no/historyquiz/auth_v2.php';
        const data = {
            action: 'log_visit',
            app: 'roma',
            country: currentCountry,
            referrer: document.referrer,
            screen_resolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language,
            device: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
        };

        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            mode: 'cors'
        })
        .then(response => response.json())
        .then(data => console.log('Visit logged:', data))
        .catch(err => {
            console.warn('Telemetry fetch failed, trying image fallback');
            const img = new Image();
            img.src = `${url}?action=log_visit&app=roma&country=${currentCountry}&v=${new Date().getTime()}`;
        });
    } catch (e) {
        console.warn('Telemetry skipped:', e);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    logVisit(); // Priority 1: Log the visit immediately
    initMap();  // Priority 2: Initialize the map interface
});

// --- ALBUM LOGIC ---
function setupAlbum() {
    const albumModal = document.getElementById('album-modal');
    const albumGrid = document.getElementById('album-grid');
    const openAlbumBtn = document.getElementById('open-album-btn');
    const closeAlbumBtn = document.getElementById('close-album');
    const albumSearchInput = document.getElementById('album-search-input');

    if (!openAlbumBtn) return;

    openAlbumBtn.onclick = () => {
        albumModal.style.display = 'flex';
        renderAlbum();
    };

    closeAlbumBtn.onclick = () => {
        albumModal.style.display = 'none';
    };

    albumSearchInput.oninput = (e) => {
        renderAlbum(e.target.value.toLowerCase());
    };

    window.addEventListener('click', (event) => {
        if (event.target == albumModal) albumModal.style.display = 'none';
    });
}

function renderAlbum(search = '') {
    const albumGrid = document.getElementById('album-grid');
    if (!albumGrid) return;
    albumGrid.innerHTML = '';
    
    // Metadata corrections (fix mislabeled images from the museum)
    const corrections = {
        "409630": { title: "The Forum Romanum (Campo Vaccino)", description: "A sweeping view of the Roman Forum, historically known as Campo Vaccino." }
    };
    
    // Blacklist of duplicate IDs (same image, different ID)
    const blacklist = ["363433", "362911", "362912", "362913"];

    const allAssets = [];
    
    // Add manual high-priority ones
    historicalGlimpses.forEach(g => {
        allAssets.push({
            title: g.title,
            image: g.image,
            description: g.description,
            manualCoords: [g.lat, g.lng]
        });
    });

    piranesiMetadata.forEach(m => {
        const idStr = m.id.toString();
        if (blacklist.includes(idStr)) return; // Skip duplicates
        
        if (!allAssets.some(a => a.image === m.image)) {
            const corr = corrections[idStr];
            allAssets.push({
                title: corr ? corr.title : m.title,
                image: m.image,
                description: corr ? corr.description : m.title,
                type: "Piranesi Original"
            });
        }
    });

    // Add all from vintage photo collection
    vintageMetadata.forEach(v => {
        allAssets.push({
            title: v.title,
            image: v.image,
            description: `${v.title}. From ${v.source}, ${v.date}.`,
            type: "Vintage Photograph"
        });
    });

    allAssets.forEach(asset => {
        const cleanTitle = asset.title.split(',')[0].split(' (')[0].replace("View of the ", "").replace("The ", "");
        const lowerTitle = asset.title.toLowerCase();
        if (search && !lowerTitle.includes(search)) return;

        const card = document.createElement('div');
        card.className = 'album-card';
        
        const badgeClass = asset.type === "Vintage Photograph" ? "badge-vintage" : "badge-piranesi";

        card.innerHTML = `
            <div style="position:relative;">
                <div class="featured-badge ${badgeClass}">${asset.type || "Historical View"}</div>
                <img src="${asset.image}" class="album-card-img" alt="${asset.title}">
            </div>
            <div class="album-card-info">
                <h3>${cleanTitle}</h3>
                <span class="category">${asset.type === "Vintage Photograph" ? "Photograph" : "Historical Etching"}</span>
            </div>
        `;

        const blacklist = [
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
            "history of the United States", "Collected poems",
            "Piazza San Marco", "Partial elevation and plan", "Adoration of the Magi", "Venus and the Lute Player", 
            "Oedipus and the Sphinx", "Title page", "Dedication to Giovanni Bottari", "Great Cascade", 
            "Amphitheatre of Tusculum", "Statue by Michael Angelo", "ruins of the world's ancient civilization", 
            "Hermann Göring", "Musicians in costume", "Trinita de' Monti"
        ];

        if (blacklist.some(b => asset.title.includes(b))) return;

        card.onclick = () => {
            // Keep album open! Only show details
            let targetCoords = asset.manualCoords;
            let targetPoint = null;

            if (!targetCoords) {
                // Fuzzy search for a point that matches this asset's title
                const keywords = lowerTitle.split(/[\s,']+/).filter(w => w.length > 4 && !["veduta", "della", "delle", "avanti", "roma", "temple", "church"].includes(w));
                if (keywords.length > 0) {
                    targetPoint = pointsData.find(p => {
                        const pTitle = p.title.toLowerCase();
                        return keywords.every(kw => pTitle.includes(kw));
                    });
                    if (targetPoint) targetCoords = [targetPoint.lat, targetPoint.lng];
                }
            }

            if (targetCoords) {
                map.flyTo(targetCoords, 17, { animate: true, duration: 2 });
            }

            showDetails({
                title: asset.title,
                category: asset.type === "Vintage Photograph" ? "Historical Photograph" : "Piranesi Etching",
                description: asset.description,
                image: asset.image,
                source: asset.source || (asset.type === "Vintage Photograph" ? "Library of Congress" : "Metropolitan Museum of Art, Open Access"),
                rights: asset.rights || "Public Domain",
                link: asset.link || null,
                lat: targetCoords ? targetCoords[0] : null,
                lng: targetCoords ? targetCoords[1] : null
            });
        };

        albumGrid.appendChild(card);
    });
}

function getFeaturedAsset(name) {
    if (!name || piranesiMetadata.length === 0) return null;
    const lowerName = name.toLowerCase();
    
    // 1. Check manual overrides first
    if (lowerName.includes("colosseum")) return { image: "assets/historical/colosseum.jpg", title: "The Colosseum (Veduta dell'Anfiteatro Flavio)" };
    if (lowerName.includes("pantheon")) return { image: "assets/historical/pantheon.jpg", title: "The Pantheon" };
    
    // 2. Smart Fuzzy Match
    // Split the monument name into keywords, ignoring short words
    const keywords = lowerName.split(/[\s,']+/).filter(w => w.length > 3 && !["temple", "church", "basilica", "piazza", "palazzo", "mausoleum"].includes(w));
    
    if (keywords.length === 0) return null;

    // Try to find a match in the Piranesi metadata
    const match = piranesiMetadata.find(m => {
        const title = m.title.toLowerCase();
        // If all keywords from the monument name appear in the Piranesi title, it's a likely match
        return keywords.every(kw => title.includes(kw));
    });
    
    if (match) return match;

    // Fallback: If any major unique word matches (for very specific names)
    return piranesiMetadata.find(m => {
        const title = m.title.toLowerCase();
        return keywords.some(kw => title.includes(kw)) && (title.includes("veduta") || title.includes("roma"));
    }) || null;
}

// Data loading handled in fetchData
