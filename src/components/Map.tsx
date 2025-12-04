import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '@/types';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYXJvc3NzIiwiYSI6ImNtaW5heTd0dDE1amgzZXIxZnVnczBmZHgifQ._8a-aON5RVdACW4_jsla7A';

interface MapProps {
  events: Event[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  center?: [number, number];
  showHeatmap?: boolean;
}

const Map: React.FC<MapProps> = ({ 
  events, 
  selectedEventId, 
  onEventSelect,
  center = [19.0402, 47.4979], // Budapest default
  showHeatmap = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: 12,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  // Add/update heatmap layer
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: events.map(event => ({
        type: 'Feature',
        properties: {
          weight: event.isFeatured ? 2 : 1
        },
        geometry: {
          type: 'Point',
          coordinates: [event.location.lng, event.location.lat]
        }
      }))
    };

    // Remove existing source and layer if they exist
    if (map.current.getLayer('events-heat')) {
      map.current.removeLayer('events-heat');
    }
    if (map.current.getSource('events')) {
      map.current.removeSource('events');
    }

    // Add source
    map.current.addSource('events', {
      type: 'geojson',
      data: geojsonData
    });

    // Add heatmap layer
    map.current.addLayer({
      id: 'events-heat',
      type: 'heatmap',
      source: 'events',
      maxzoom: 18,
      paint: {
        // Increase weight based on property
        'heatmap-weight': ['get', 'weight'],
        // Increase intensity as zoom level increases
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          18, 3
        ],
        // Color ramp for heatmap - purple/pink gradient matching app theme
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.1, 'rgba(103, 58, 183, 0.3)',
          0.3, 'rgba(139, 92, 246, 0.5)',
          0.5, 'rgba(168, 85, 247, 0.6)',
          0.7, 'rgba(236, 72, 153, 0.7)',
          1, 'rgba(255, 0, 128, 0.9)'
        ],
        // Adjust radius by zoom level
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 20,
          12, 40,
          18, 80
        ],
        // Transition from heatmap to circle layer by zoom level
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, showHeatmap ? 0.8 : 0,
          16, showHeatmap ? 0.4 : 0
        ]
      }
    });
  }, [events, mapLoaded, showHeatmap]);

  // Update markers when events change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    events.forEach((event) => {
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.innerHTML = `
        <div class="relative cursor-pointer group">
          <div class="absolute inset-0 rounded-full ${event.isFeatured ? 'bg-purple-500' : 'bg-cyan-500'} animate-ping opacity-40"></div>
          <div class="relative w-4 h-4 rounded-full ${event.isFeatured ? 'bg-purple-500' : 'bg-cyan-500'} flex items-center justify-center shadow-lg" style="box-shadow: 0 0 20px ${event.isFeatured ? 'rgba(168, 85, 247, 0.6)' : 'rgba(6, 182, 212, 0.6)'}">
            ${event.isFeatured ? '<svg class="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : ''}
          </div>
        </div>
      `;

      el.addEventListener('click', () => {
        onEventSelect(event.id);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.location.lng, event.location.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [events, onEventSelect]);

  // Fly to selected event
  useEffect(() => {
    if (!map.current || !selectedEventId) return;

    const event = events.find(e => e.id === selectedEventId);
    if (event) {
      map.current.flyTo({
        center: [event.location.lng, event.location.lat],
        zoom: 15,
        pitch: 60,
        duration: 1500
      });
    }
  }, [selectedEventId, events]);

  return (
    <div ref={mapContainer} className="absolute inset-0" />
  );
};

export default Map;
