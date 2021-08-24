// ESLint is for nodejs -> disable it
/* eslint-disable */

export const displayMap = locations => {
    mapboxgl.accessToken = 'pk.eyJ1IjoidmFhcm9uY2FycmFzY28iLCJhIjoiY2tzNGRnenZ3MTdsczJucnk1NGYzYTdociJ9.4XHcAmlWt8M3FaKmw_7a5w';
    var map = new mapboxgl.Map({
        container: 'map', // id = map -> #map
        style: 'mapbox://styles/vaaroncarrasco/cks4e71zi4kti17qp2sgn7gci',
        scrollZoom: false
        // center: [lng, lat],
        // zoom: 10
        // interactive: false
    });

    // Methods thanks to Mapbox lib import
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc => {
        // Create marker
        const el = document.createElement('div');
        el.className = 'marker';

        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        })
            .setLngLat(loc.coordinates)
            .addTo(map);

        // Add popup
        new mapboxgl.Popup({
                offset: 30
            })
                .setLngLat(loc.coordinates)
                .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
                .addTo(map);

        // Extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            RTCIceGatherer: 100
        }
    });
}
