// Inicializar autenticación OAuth2
function init() {
  gapi.load('client', function() {
    gapi.client.init({
      apiKey: 'TU_API_KEY',
      clientId: 'TU_CLIENT_ID',
      scope: 'https://www.googleapis.com/auth/earthengine',
      discoveryDocs: ['https://earthengine.googleapis.com/$discovery/rest?version=v1']
    }).then(function () {
      ee.data.authenticateViaOauth(
        gapi.auth2.getAuthInstance(),
        function() {
          ee.initialize(null, null, function() {
            console.log('✅ GEE inicializado');
            cargarMapa();
          }, function(err) {
            console.error('Error al inicializar GEE:', err);
          });
        },
        function(err) {
          console.error('Error de autenticación:', err);
        }
      );
    });
  });
}

// Estilos por categoría
var coloresCategorias = {
  'Extrema (>101°C)': '#ff0000',
  'Muy Alta (81-100°C)': '#ff6600',
  'Alta (61-80°C)': '#ffff00',
  'Moderada (41-60°C)': '#e1ff00',
  'Baja (<40°C)': '#cccccc'
};

function procesarTemperatura(f) {
  var brightness = f.getNumber('brightness');
  var bright_ti4 = f.getNumber('bright_ti4');
  var tempK = brightness.gt(0).ifElse(brightness, bright_ti4);
  var tempC = tempK.subtract(273.15);

  var categoria = tempC.gt(101).ifElse('Extrema (>101°C)',
    tempC.gt(81).ifElse('Muy Alta (81-100°C)',
    tempC.gt(61).ifElse('Alta (61-80°C)',
    tempC.gt(41).ifElse('Moderada (41-60°C)', 'Baja (<40°C)'))));

  return f.set({
    'temp_c': tempC,
    'temp_categoria': categoria,
    'temp_original_k': tempK,
    'sensor': 'MODIS'
  });
}

function aplicarEstilo(f) {
  var categoria = f.get('temp_categoria');
  var color = ee.Dictionary(coloresCategorias).get(categoria);

  return f.set('style', {
    color: '#000000',
    width: 1.5,
    fillColor: color,
    fillOpacity: 0.95
  });
}

function cargarMapa() {
  var focosMODIS = ee.FeatureCollection('projects/ee-femaquera20/assets/FIRMS_automatico/focos_calor_modis_bolivia');

  // Procesar
  var procesado = focosMODIS
    .map(procesarTemperatura)
    .map(aplicarEstilo);

  // Estilo visual con estiloProperty
  var styled = procesado.style({styleProperty: 'style'});

  // Crear el mapa base
  var map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -16.52, lng: -64.99 },
    zoom: 6,
    mapTypeId: 'roadmap'
  });

  // Añadir como overlay
  styled.getMap({}, function(mapLayer) {
    var eeMapType = new ee.layers.ImageOverlay(mapLayer);
    map.overlayMapTypes.push(eeMapType);
  });
}

init();
