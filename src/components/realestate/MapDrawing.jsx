import React, { useEffect, useRef, useState } from 'react';

/**
 * MapDrawing Component (Google Maps Version)
 * Interactive map with drawing tools for property boundaries
 * Uses Google Maps Drawing Library for stable, feature-rich drawing
 * Supports: Polygons, Rectangles, Circles, Polylines, and Markers
 */

const MapDrawing = ({ onGeometryChange, onDrawingStart, initialGeometry }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const drawingManager = useRef(null);
  const drawnShape = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const scriptLoadedRef = useRef(false);
  const mapInitializedRef = useRef(false);

  // Load Google Maps and Drawing Library
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (scriptLoadedRef.current) return;
      scriptLoadedRef.current = true;

      // Check if Google Maps is already loaded
      if (window.google?.maps?.drawing?.DrawingManager) {
        initializeMap();
        return;
      }

      // Load Google Maps with drawing library
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;

      const checkGoogleReady = () => {
        if (window.google?.maps?.drawing?.DrawingManager) {
          initializeMap();
        } else {
          setTimeout(checkGoogleReady, 100);
        }
      };

      script.onload = checkGoogleReady;
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script for MapDrawing');
        console.error('Please verify:');
        console.error('1. API key is valid in .env file (REACT_APP_GOOGLE_MAPS_KEY)');
        console.error('2. Maps JavaScript API is enabled in Google Cloud Console');
        console.error('3. API key restrictions allow this domain');
        scriptLoadedRef.current = false;
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();

    return () => {
      if (map.current) {
        // Cleanup is minimal with Google Maps
      }
    };
  }, []);

  const initializeMap = () => {
    if (!mapContainer.current || mapInitializedRef.current) return;
    mapInitializedRef.current = true;

    const google = window.google;

    // Create map
    map.current = new google.maps.Map(mapContainer.current, {
      zoom: 13,
      center: { lat: -1.9441, lng: 29.8739 }, // Kigali, Rwanda
      mapTypeId: 'hybrid', // ✅ Hybrid = satellite + place names
      tilt: 0,
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_RIGHT,
        mapTypeIds: ['satellite', 'hybrid', 'roadmap', 'terrain']
      }
    });

    // Create drawing manager
    drawingManager.current = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_LEFT,
        drawingModes: [
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.RECTANGLE,
          google.maps.drawing.OverlayType.CIRCLE,
          google.maps.drawing.OverlayType.POLYLINE,
          google.maps.drawing.OverlayType.MARKER
        ]
      },
      polygonOptions: {
        clickable: true,
        draggable: true,
        editable: true,
        fillColor: '#16a34a',
        fillOpacity: 0.3,
        strokeColor: '#16a34a',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        zIndex: 1
      },
      rectangleOptions: {
        clickable: true,
        draggable: true,
        editable: true,
        fillColor: '#f59e0b',
        fillOpacity: 0.3,
        strokeColor: '#f59e0b',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        zIndex: 1
      },
      circleOptions: {
        clickable: true,
        draggable: true,
        editable: true,
        fillColor: '#8b5cf6',
        fillOpacity: 0.3,
        strokeColor: '#8b5cf6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        zIndex: 1
      },
      polylineOptions: {
        clickable: true,
        draggable: true,
        editable: true,
        strokeColor: '#3b82f6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        zIndex: 1
      },
      markerOptions: {
        draggable: true
      }
    });

    drawingManager.current.setMap(map.current);

    // Handle drawing completion
    google.maps.event.addListener(drawingManager.current, 'overlaycomplete', (event) => {
      if (drawnShape.current) {
        drawnShape.current.setMap(null);
      }
      drawnShape.current = event.overlay;
      setHasDrawing(true);
      extractGeometry();

      // Disable drawing mode and switch to editing
      drawingManager.current.setDrawingMode(null);

      // Re-enable drawing mode when user finishes with this shape
      google.maps.event.addListener(event.overlay, 'click', () => {
        // Allow user to draw another shape
      });

      // Listen for edits
      const updateListener = () => {
        extractGeometry();
      };

      if (event.overlay.getPath) {
        google.maps.event.addListener(event.overlay.getPath(), 'set_at', updateListener);
        google.maps.event.addListener(event.overlay.getPath(), 'insert_at', updateListener);
      } else if (event.overlay.getBounds) {
        google.maps.event.addListener(event.overlay, 'bounds_changed', updateListener);
      } else if (event.overlay.getCenter) {
        google.maps.event.addListener(event.overlay, 'center_changed', updateListener);
        google.maps.event.addListener(event.overlay, 'radius_changed', updateListener);
      }
    });

    setIsMapReady(true);
    onDrawingStart?.(true);
  };

  const extractGeometry = () => {
    if (!drawnShape.current) {
      onGeometryChange(null);
      return;
    }

    const google = window.google;
    let geometry = null;

    try {
      if (drawnShape.current instanceof google.maps.Polygon) {
        // Polygon or Rectangle
        const paths = drawnShape.current.getPaths();
        const coordinates = [];

        paths.forEach((path) => {
          const pathCoordinates = [];
          path.forEach((latLng) => {
            pathCoordinates.push([latLng.lng(), latLng.lat()]);
          });
          // Close the ring if not already closed
          if (
            pathCoordinates[0][0] !== pathCoordinates[pathCoordinates.length - 1][0] ||
            pathCoordinates[0][1] !== pathCoordinates[pathCoordinates.length - 1][1]
          ) {
            pathCoordinates.push(pathCoordinates[0]);
          }
          coordinates.push(pathCoordinates);
        });

        geometry = {
          type: 'Polygon',
          coordinates: coordinates
        };
      } else if (drawnShape.current instanceof google.maps.Circle) {
        // Circle - approximate as polygon with 32 points
        const center = drawnShape.current.getCenter();
        const radius = drawnShape.current.getRadius();
        const points = 32;
        const coordinates = [];

        for (let i = 0; i < points; i++) {
          const angle = (i * 360) / points;
          const rad = (angle * Math.PI) / 180;

          // Calculate lat/lng offset from center
          const latOffset = (radius / 111320) * Math.cos(rad);
          const lngOffset =
            (radius / (111320 * Math.cos((center.lat() * Math.PI) / 180))) *
            Math.sin(rad);

          coordinates.push([
            center.lng() + lngOffset,
            center.lat() + latOffset
          ]);
        }
        // Close the circle
        coordinates.push(coordinates[0]);

        geometry = {
          type: 'Polygon',
          coordinates: [coordinates]
        };
      } else if (drawnShape.current instanceof google.maps.Polyline) {
        // Polyline
        const path = drawnShape.current.getPath();
        const coordinates = [];

        path.forEach((latLng) => {
          coordinates.push([latLng.lng(), latLng.lat()]);
        });

        geometry = {
          type: 'LineString',
          coordinates
        };
      } else if (drawnShape.current instanceof google.maps.Marker) {
        // Marker
        const position = drawnShape.current.getPosition();

        geometry = {
          type: 'Point',
          coordinates: [position.lng(), position.lat()]
        };
      }

      if (geometry) {
        onGeometryChange(geometry);
      }
    } catch (error) {
      console.error('Error extracting geometry:', error);
    }
  };

  const clearDrawing = () => {
    if (drawnShape.current) {
      drawnShape.current.setMap(null);
      drawnShape.current = null;
      setHasDrawing(false);
      onGeometryChange(null);
      
      // Reset drawing mode to polygon
      if (drawingManager.current && window.google?.maps?.drawing?.OverlayType) {
        drawingManager.current.setDrawingMode(
          window.google.maps.drawing.OverlayType.POLYGON
        );
      }
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">🎨 Draw Property Boundary</h4>
        <p className="text-sm text-blue-800 mb-3">
          Use the drawing tools on the map to draw your property boundary. You can draw:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
          <div>
            <span className="font-medium">📍 Polygon</span>
            <p className="text-xs">Click to add points</p>
          </div>
          <div>
            <span className="font-medium">📦 Rectangle</span>
            <p className="text-xs">Click & drag to draw</p>
          </div>
          <div>
            <span className="font-medium">⭕ Circle</span>
            <p className="text-xs">Click & drag to draw</p>
          </div>
          <div>
            <span className="font-medium">➖ Polyline</span>
            <p className="text-xs">Click to add points</p>
          </div>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          💡 Tip: You can edit your drawing by dragging points or the entire shape. Click the drawing tool again to draw a new shape.
        </p>
        {hasDrawing && (
          <button
            type="button"
            onClick={clearDrawing}
            className="mt-3 px-4 py-2 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
          >
            🗑️ Clear Drawing
          </button>
        )}
      </div>

      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '400px',
          borderRadius: '0.5rem',
          border: '2px solid #e5e7eb'
        }}
        className="shadow-md"
      />

      {!isMapReady && (
        <div className="mt-4 p-4 bg-gray-100 rounded text-center text-gray-600">
          ⏳ Loading map...
        </div>
      )}
    </div>
  );
};

export default MapDrawing;
