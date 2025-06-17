const map = L.map('map').setView([-22.29, -68.17], 8);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

async function initBackend() {
  const res = await fetch('http://localhost:3000/init');
  return res.json();
}

async function addGeeLayer() {
  const thumbRes = await fetch('http://localhost:3000/thumb');
  const { thumbUrl } = await thumbRes.json();
  L.imageOverlay(thumbUrl, map.getBounds()).addTo(map);
}

initBackend().then(() => addGeeLayer());

document.getElementById('export').addEventListener('click', () => {
  html2canvas(document.getElementById('map')).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF({ orientation: 'landscape' });
    pdf.addImage(imgData, 'PNG', 10, 10, 277, 190);
    pdf.save('vista-mapa.pdf');
  });
});