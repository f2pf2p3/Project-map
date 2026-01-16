let map;
let activeInfoWindow; // ตัวแปรเก็บ InfoWindow ที่เปิดอยู่ปัจจุบัน
let markers = [];
let foodShopsData = [];


// --- ส่วนที่ 1: ฟังก์ชันเริ่มต้นแผนที่ ---
function initMap() {
    // 2.1 ตั้งค่าจุดศูนย์กลางและซูมเริ่มต้น (ตั้งไว้ที่กึ่งกลางประเทศไทย)
    map = new google.maps.Map(document.getElementById("map"), {
        center: { lat: 13.736717, lng: 100.523186 },
        zoom: 6, // ระดับการซูมให้เห็นทั่วประเทศ
        mapTypeControl: false, // ซ่อนปุ่มเปลี่ยนประเภทแผนที่ (ถ้าต้องการ)
        streetViewControl: false // ซ่อนปุ่ม Street View
    });

    // 2.2 วนลูปข้อมูลและสร้างหมุด (Marker)
    fetch("foodShopsData.json")
    .then(res => res.json())
    .then(data => {
        foodShopsData = data;
        data.forEach(shop => createMarker(shop));
    });
}

// --- ส่วนที่ 2: ฟังก์ชันสร้างหมุดและหน้าต่างข้อมูล ---
// สร้าง marker จาก JSON
function createMarker(shop) {
    const marker = new google.maps.Marker({
        position: { lat: shop.lat, lng: shop.lng },
        map: map,
        title: shop.name
    });

    const info = new google.maps.InfoWindow({
        content: `
            <h3>${shop.name}</h3>
            <p>${shop.data}</p>
            <p>${shop.description}</p>
            <p><b>อาหาร:</b> ${shop.food.join(", ")}</p>
            <a href="${shop.link}" target="_blank">ดูร้าน</a><br>
            <button onclick="deleteShop(${shop.id})">Delete</button>
        `
    });

    marker.addListener("click", () => info.open(map, marker));
    markers.push(marker);
}

function deleteShop(id) {
    if (!confirm("Delete this location?")) return;

    const formData = new FormData();
    formData.append("id", id);

    fetch("delete.php", {
        method: "POST",
        body: formData
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

// รับค่าจากฟอร์ม
document.getElementById("form").addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);

    fetch("save.php", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(result => {
        if (result.status === "success") {
            alert("Saved successfully!");

            // Reload markers
            location.reload();
        }
    })
    .catch(err => console.error(err));
    
    const shop = {
        date: document.getElementById("date").value,
        id: document.getElementById("id").value,
        name: document.getElementById("name").value,
        lat: parseFloat(document.getElementById("lat").value),
        lng: parseFloat(document.getElementById("lng").value),
        location: document.getElementById("loc").value,
        food: document.getElementById("food").value.split(","),
        description: document.getElementById("des").value,
        link: document.getElementById("link").value
    };

    createMarker(shop);

});