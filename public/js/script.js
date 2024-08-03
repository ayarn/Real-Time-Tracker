const socket = io();
let username = localStorage.getItem("username");

if (!username) {
  document.getElementById("username-container").style.display = "block";
  document.getElementById("username-submit").addEventListener("click", () => {
    username = document.getElementById("username-input").value;
    if (username) {
      localStorage.setItem("username", username);
      document.getElementById("username-container").style.display = "none";
      initMap();
    }
  });
} else {
  initMap();
}

function initMap() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        socket.emit("send-location", { latitude, longitude, username });
      },
      (error) => {
        console.error(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  }

  const map = L.map("map").setView([0, 0], 16);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "Ayarn Modi",
  }).addTo(map);

  const markers = {};

  socket.on("receive-location", (data) => {
    const { id, latitude, longitude, username } = data;
    map.setView([latitude, longitude], 16);
    if (markers[id]) {
      markers[id].setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude]).addTo(map);
      marker.bindPopup(`
		<div style="
		  width: auto;
		  text-align: center;
		  font-size: 14px;
		  line-height: 1.4;
		">
		  ${username}
		</div>
	  `).openPopup();
      markers[id] = marker;
    }
  });

  socket.on("user-disconnected", (id) => {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
  });
}
