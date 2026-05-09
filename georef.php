<?php
session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    ?>
    <!DOCTYPE html>
    <html lang="no">
    <head>
        <meta charset="UTF-8">
        <title>GeoRef Login - Roma</title>
        <style>
            body { background: #0b0f19; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            form { background: #111827; padding: 2rem; border-radius: 12px; border: 1px solid #374151; width: 300px; }
            input { padding: 10px; border-radius: 4px; border: 1px solid #374151; background: #1f2937; color: white; width: 100%; box-sizing: border-box; margin-bottom: 10px; }
            button { width: 100%; padding: 10px; background: #38bdf8; color: #0b0f19; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
        </style>
    </head>
    <body>
        <form onsubmit="doLogin(event)">
            <h3 style="margin-top:0;">GeoRef Login (Roma)</h3>
            <input type="password" id="pin-input" placeholder="PIN-kode" autofocus>
            <div id="msg" style="color: #ef4444; font-size: 0.9rem; margin-bottom: 10px;"></div>
            <button type="submit">Logg inn</button>
        </form>
        <script>
            async function doLogin(e) {
                e.preventDefault();
                const pin = document.getElementById('pin-input').value;
                const res = await fetch('admin_check.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin })
                });
                const data = await res.json();
                if (data.success) location.reload();
                else document.getElementById('msg').innerText = "Feil PIN.";
            }
        </script>
    </body>
    </html>
    <?php
    exit;
}
?>
<!DOCTYPE html>
<html lang="no">
<head>
    <meta charset="UTF-8">
    <title>Roma Georeference Tool</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet-toolbar@0.4.0-alpha.2/dist/leaflet.toolbar.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet-distortableimage@0.21.7/dist/leaflet.distortableimage.css">
    <style>
        :root { --bg-color: #0b0f19; --accent-color: #f39c12; --panel-bg: rgba(17, 24, 39, 0.95); }
        body, html { margin: 0; padding: 0; height: 100%; font-family: 'Outfit', sans-serif; background: var(--bg-color); color: white; overflow: hidden; }
        #map { height: 100vh; width: 100vw; background: #000; }
        #control-panel { position: fixed; top: 20px; left: 20px; z-index: 9999; background: var(--panel-bg); padding: 20px; border-radius: 12px; width: 340px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5); }
        h2 { margin: 0 0 10px 0; color: var(--accent-color); font-size: 1.4rem; }
        .instructions { font-size: 0.85rem; color: #94a3b8; margin-bottom: 15px; }
        .upload-section { background: rgba(243, 156, 18, 0.1); padding: 20px; border-radius: 8px; border: 2px dashed var(--accent-color); text-align: center; margin-bottom: 15px; }
        button { width: 100%; padding: 12px; background: var(--accent-color); border: none; border-radius: 8px; color: #0b0f19; font-weight: 800; cursor: pointer; margin-top: 10px; }
        .coord-box { background: rgba(0, 0, 0, 0.4); padding: 10px; border-radius: 8px; font-family: monospace; font-size: 0.7rem; margin: 10px 0; color: var(--accent-color); max-height: 150px; overflow-y: auto; }
        .slider-container { background: rgba(0, 0, 0, 0.4); padding: 10px; border-radius: 8px; margin-bottom: 10px; }
        .status-msg { margin-top: 10px; font-size: 0.85rem; padding: 10px; border-radius: 4px; display: none; }
    </style>
</head>
<body>
    <div id="control-panel">
        <h2>Roma Georef</h2>
        <div class="instructions">
            1. Last opp kartet (Falda).<br>
            2. Dra og vri kartet på plass.<br>
            3. Bruk <b>Hjørner</b> (Distort) for finjustering.<br>
            4. Trykk Lagre når du er ferdig.
        </div>
        
        <div class="upload-section">
            <label style="display:block; margin-bottom:10px; font-size:0.8rem;">Velg eksisterende kart eller last opp nytt:</label>
            <select id="map-select" onchange="loadExistingMap(this.value)" style="width:100%; padding:10px; background:#1f2937; color:white; border:1px solid #374151; border-radius:4px; margin-bottom:10px;">
                <option value="">-- Velg kart --</option>
                <option value="assets/falda/falda.jpg">Falda (1676)</option>
                <option value="assets/Kiepert/11690011.jpg">Kiepert (1892)</option>
                <option value="assets/Platner/The_Topography_and_Monuments_of_Ancient_Rome.jpg">Platner (1911)</option>
            </select>
            <div style="margin: 10px 0; font-size: 0.7rem; color: #94a3b8;">- ELLER -</div>
            <input type="file" id="file-upload" accept="image/*" onchange="handleUpload(this)" style="display:none">
            <button onclick="document.getElementById('file-upload').click()">Last opp nytt bilde</button>
            <div id="upload-status" style="margin-top:10px; font-size:0.8rem;"></div>
        </div>

        <div class="slider-container">
            <label>Gjennomsiktighet: <span id="opacity-val">50%</span></label>
            <input type="range" min="0" max="1" step="0.05" value="0.5" oninput="updateOpacity(this.value)">
        </div>

        <div id="coord-output" class="coord-box">Venter på bilde...</div>
        
        <button onclick="saveMetadata()">Lagre Georeferering</button>
        <button style="background: #34495e; color: white;" onclick="location.href='index.html'">Tilbake til Kartet</button>
        
        <div id="global-status" class="status-msg"></div>
    </div>

    <div id="map"></div>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-toolbar@0.4.0-alpha.2/dist/leaflet.toolbar.js"></script>
    <script>if (typeof L !== 'undefined' && typeof L.Toolbar2 !== 'undefined') L.Toolbar = L.Toolbar2;</script>
    <script src="https://unpkg.com/leaflet-distortableimage@0.21.7/dist/vendor.js"></script>
    <script src="https://unpkg.com/leaflet-distortableimage@0.21.7/dist/leaflet.distortableimage.js"></script>

    <script>
        const map = L.map('map').setView([41.8902, 12.4922], 14);
        const satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}').addTo(map);
        const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
        L.control.layers({"Satellite": satellite, "OSM": osm}, {}, {position: 'bottomright'}).addTo(map);

        let img, imgPath;

        function showStatus(msg, isError = false) {
            const el = document.getElementById('global-status');
            el.innerText = msg;
            el.style.display = 'block';
            el.style.background = isError ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)';
            el.style.color = isError ? '#f87171' : '#34d399';
        }
        function loadExistingMap(path) {
            if (!path) return;
            imgPath = path;
            if (img) map.removeLayer(img);
            
            const center = map.getCenter();
            img = L.distortableImageOverlay(imgPath, {
                corners: [
                    L.latLng(center.lat + 0.005, center.lng - 0.005),
                    L.latLng(center.lat + 0.005, center.lng + 0.005),
                    L.latLng(center.lat - 0.005, center.lng - 0.005),
                    L.latLng(center.lat - 0.005, center.lng + 0.005)
                ],
                opacity: 0.5, editable: true
            }).addTo(map);
            
            img.on('edit drag rotate scale', updateOutput);
            updateOutput();
            showStatus("Kart lastet inn. Du kan nå flytte på det.");
        }

        async function handleUpload(input) {
            if (!input.files[0]) return;
            const status = document.getElementById('upload-status');
            status.innerText = "Laster opp...";
            
            const formData = new FormData();
            formData.append('image', input.files[0]);
            
            try {
                const res = await fetch('upload.php', { method: 'POST', body: formData });
                const data = await res.json();
                
                if (data.success) {
                    status.innerText = "Opplasting OK! Legger til kart...";
                    imgPath = data.filePath;
                    if (img) map.removeLayer(img);
                    
                    const center = map.getCenter();
                    img = L.distortableImageOverlay(imgPath, {
                        corners: [
                            L.latLng(center.lat + 0.005, center.lng - 0.005),
                            L.latLng(center.lat + 0.005, center.lng + 0.005),
                            L.latLng(center.lat - 0.005, center.lng - 0.005),
                            L.latLng(center.lat - 0.005, center.lng + 0.005)
                        ],
                        opacity: 0.5, editable: true
                    }).addTo(map);
                    
                    img.on('edit drag rotate scale', updateOutput);
                    updateOutput();
                    document.getElementById('upload-box').style.display = 'none';
                    showStatus("Bilde lagt til. Du kan nå flytte på det.");
                } else {
                    status.innerText = "❌ " + data.error;
                    showStatus("Opplasting feilet: " + data.error, true);
                }
            } catch (e) {
                status.innerText = "❌ Teknisk feil.";
                showStatus("Feil: " + e.message, true);
            }
        }

        function updateOpacity(v) {
            if (img) img.setOpacity(v);
            document.getElementById('opacity-val').innerText = Math.round(v*100) + "%";
        }

        function updateOutput() {
            if (!img) return;
            const corners = img.getCorners();
            document.getElementById('coord-output').innerText = JSON.stringify(corners, null, 2);
        }

        async function saveMetadata() {
            if (!img) return;
            try {
                const res = await fetch('save_georef.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: "Falda Roma",
                        imagePath: imgPath,
                        corners: img.getCorners()
                    })
                });
                const data = await res.json();
                if (data.success) alert("Georeferering er lagret!");
                else alert("Feil ved lagring: " + data.error);
            } catch (e) {
                alert("Teknisk feil ved lagring: " + e.message);
            }
        }
    </script>
</body>
</html>
