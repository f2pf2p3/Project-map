let map;
let activeInfoWindow; // ตัวแปรเก็บ InfoWindow ที่เปิดอยู่ปัจจุบัน
let markers = [];
let foodShopsData = [];


// --- ส่วนที่ 1: ฟังก์ชันเริ่มต้นแผนที่ ---
let selectedLat = null;
let selectedLng = null;
let selectedMarker = null;
let selectedTime = null;

function initMap() {
    const defaultLocation = { lat: 13.736717, lng: 100.523186 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false
    });

    // 📱 mobile tap
    map.addListener("click", (event) => {
        if (window.innerWidth <= 900) {
            setMarkerFromEvent(event);
        }
    });

    //  desktop right click
    map.addListener("rightclick", setMarkerFromEvent);

    //  autocomplete
    const input = document.getElementById("searchBox");
    const autocomplete = new google.maps.places.Autocomplete(input);

    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        map.panTo(place.geometry.location);
        map.setZoom(15);

        if (marker) marker.setMap(null);

        marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location
        });
    });

    //  โหลด marker จาก JSON
    fetch("foodShopsData.json")
        .then(res => res.json())
        .then(data => {
            foodShopsData = data;
            data.forEach(shop => createMarker(shop));
        });

    updateSelectionText();
}

const form = document.getElementById("form");
const handle = document.getElementById("dragHandle");

let isDragging = false;
let startY = 0;
let startHeight = 0;

handle.addEventListener("touchstart", (e) => {
    isDragging = true;
    startY = e.touches[0].clientY;
    startHeight = form.offsetHeight;
});

document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;

    const currentY = e.touches[0].clientY;
    const diff = startY - currentY;

    let newHeight = startHeight + diff;

    // จำกัดความสูง
    const minHeight = window.innerHeight * 0.2;
    const maxHeight = window.innerHeight * 0.9;

    if (newHeight < minHeight) newHeight = minHeight;
    if (newHeight > maxHeight) newHeight = maxHeight;

    form.style.height = newHeight + "px";
});

document.addEventListener("touchend", () => {
    isDragging = false;
});

function updateSelectionText() {
    const coordsText = selectedLat && selectedLng
        ? `Selected coordinates:<br>${selectedLat.toFixed(6)}, ${selectedLng.toFixed(6)}`
        : "Right-click or tap on map to choose location.";

    const timeText = selectedTime
        ? `Selected time:<br>${selectedTime.toLocaleString()} (${selectedTime.toLocaleTimeString()})`
        : "";

    document.getElementById("selected-coords").innerHTML =
        `${coordsText}${timeText ? "<br><br>" + timeText : ""}`;
}

function setMarkerFromEvent(event) {
    selectedLat = event.latLng.lat();
    selectedLng = event.latLng.lng();
    selectedTime = new Date();
    document.getElementById("lat").value = selectedLat;
    document.getElementById("lng").value = selectedLng;

    if (selectedMarker) {
        selectedMarker.setMap(null);
    }
    selectedMarker = new google.maps.Marker({
        position: { lat: selectedLat, lng: selectedLng },
        map: map,
        label: "A"
    });
    updateSelectionText();
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 13.736717, lng: 100.523186 },
        zoom: 6,
        mapTypeControl: false,
        streetViewControl: false
    });

    map.addListener("rightclick", setMarkerFromEvent);
    map.addListener("click", (event) => {
        if (window.innerWidth <= 900) {
            setMarkerFromEvent(event);
        }
    });

    fetch("foodShopsData.json")
        .then(res => res.json())
        .then(data => {
            foodShopsData = data;
            data.forEach(shop => createMarker(shop));
        });
    updateSelectionText();
}

// --- ส่วนที่ 2: ฟังก์ชันสร้างหมุดและหน้าต่างข้อมูล ---
// สร้าง marker จาก JSON
function createMarker(shop) {
    const marker = new google.maps.Marker({
        position: { lat: Number(shop.lat), lng: Number(shop.lng) },
        map: map,
        title: shop.name
    });

    const info = new google.maps.InfoWindow({
        content: `
            ${shop.thumbnail ? `<img src="${shop.thumbnail}" alt="${shop.name} thumbnail" style="width:100%;max-height:150px;object-fit:cover;margin-bottom:8px;"/>` : ""}
            <h3 style="margin: 0 0 8px 0;">${shop.name}</h3>
            <p><b>Location:</b> ${shop.location || "(no location)"}</p>
            ${shop.date ? `<p><b>Time:</b> ${shop.date} (${shop.timezone || "local"})</p>` : ""}
            <p>${shop.description}</p>
            <p><b>อาหาร:</b> ${Array.isArray(shop.food) ? shop.food.join(", ") : shop.food}</p>
            <a href="${shop.link}" target="_blank">ดูร้าน</a><br>
            <button onclick="deleteShop(${shop.id})">Delete</button>
        `
    });

    marker.addListener("click", () => info.open(map, marker));
    markers.push(marker);
}

function deleteShop(id) {
    if (!confirm("Delete this location?")) return;

    fetch("/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    })
        .then(res => res.json())
        .then(result => {
            if (result.status === "deleted") {
                alert("Deleted");
                location.reload();
            }
        })
        .catch(err => console.error(err));
}

function searchMarker() {
    const keyword = document.getElementById("searchBox").value.toLowerCase().trim();
    const keywords = keyword.split(/\s+/);

    markers.forEach((marker, index) => {
        const shop = foodShopsData[index];

        //  ดึง text ทั้งหมด
        let locationText = (shop.location || "").toLowerCase();

        //  ตัดคำพวก "จ." "อ." ออก
        locationText = locationText
            .replace(/จ\./g, "")
            .replace(/อ\./g, "")
            .replace(/ตำบล|อำเภอ|จังหวัด/g, "");

        const text = (
            shop.name + " " +
            locationText + " " +
            (Array.isArray(shop.food) ? shop.food.join(" ") : shop.food || "")
        ).toLowerCase();

        const match = keywords.every(k => text.includes(k));

        marker.setVisible(match);

        if (match && keyword !== "") {
            map.panTo(marker.getPosition());
            map.setZoom(12);
        }
    });

    if (!keyword) {
        markers.forEach(marker => marker.setVisible(true));
    }
}

// รับค่าจากฟอร์ม
document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedTime) {
        selectedTime = new Date();
    }

    const formData = new FormData();
    formData.append("name", document.getElementById("name").value);
    formData.append("loc", document.getElementById("loc").value);
    formData.append("food", document.getElementById("food").value);
    formData.append("des", document.getElementById("des").value);
    formData.append("link", document.getElementById("link").value);
    formData.append("lat", selectedLat);
    formData.append("lng", selectedLng);
    formData.append("date", selectedTime.toLocaleString());
    formData.append("timezone", Intl.DateTimeFormat().resolvedOptions().timeZone);

    const fileInput = document.getElementById("thumbnail");
    if (fileInput.files && fileInput.files.length > 0) {
        formData.append("thumbnail", fileInput.files[0]);
    }

    fetch("/save", {
        method: "POST",
        body: formData
    })
        .then(res => res.json())
        .then(result => {
            if (result.status === "success") {
                alert("Saved successfully!");
                location.reload();
            } else {
                alert("Save failed: " + (result.message || "unknown"));
            }
        })
        .catch(err => {
            console.error(err);
            alert("Save failed");
        });
});