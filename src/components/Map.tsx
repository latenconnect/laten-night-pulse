import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Event } from '@/types';
import { Club } from '@/hooks/useClubs';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYXJvc3NzIiwiYSI6ImNtaW5heTd0dDE1amgzZXIxZnVnczBmZHgifQ._8a-aON5RVdACW4_jsla7A';

interface MapProps {
  events: Event[];
  clubs?: Club[];
  selectedEventId: string | null;
  onEventSelect: (eventId: string) => void;
  onClubSelect?: (club: Club) => void;
  center?: [number, number];
  showHeatmap?: boolean;
}

const Map: React.FC<MapProps> = ({ 
  events, 
  clubs = [],
  selectedEventId, 
  onEventSelect,
  onClubSelect,
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

    // Combine events and clubs into heatmap data
    const eventFeatures = events.map(event => ({
      type: 'Feature' as const,
      properties: {
        weight: event.isFeatured ? 2 : 1
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [event.location.lng, event.location.lat]
      }
    }));

    const clubFeatures = clubs.map(club => ({
      type: 'Feature' as const,
      properties: {
        weight: club.rating ? Math.min(club.rating / 2.5, 2) : 0.5 // Weight based on rating
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [club.longitude, club.latitude]
      }
    }));

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [...eventFeatures, ...clubFeatures]
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
  }, [events, clubs, mapLoaded, showHeatmap]);

  // Update markers when events or clubs change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add event markers
    events.forEach((event) => {
      const el = document.createElement('div');
      el.className = 'event-marker';

      const wrapper = document.createElement('div');
      wrapper.className = 'relative cursor-pointer group';

      const ring = document.createElement('div');
      ring.className = 'absolute inset-0 rounded-full animate-ping opacity-40';
      ring.classList.add(event.isFeatured ? 'bg-purple-500' : 'bg-cyan-500');

      const circle = document.createElement('div');
      circle.className = 'relative w-4 h-4 rounded-full flex items-center justify-center shadow-lg';
      circle.classList.add(event.isFeatured ? 'bg-purple-500' : 'bg-cyan-500');
      circle.style.boxShadow = event.isFeatured
        ? '0 0 20px rgba(168, 85, 247, 0.6)'
        : '0 0 20px rgba(6, 182, 212, 0.6)';

      if (event.isFeatured) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'w-2 h-2 text-white');
        svg.setAttribute('fill', 'currentColor');
        svg.setAttribute('viewBox', '0 0 24 24');

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute(
          'd',
          'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
        );

        svg.appendChild(path);
        circle.appendChild(svg);
      }

      wrapper.appendChild(ring);
      wrapper.appendChild(circle);
      el.appendChild(wrapper);

      el.addEventListener('click', () => {
        onEventSelect(event.id);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([event.location.lng, event.location.lat])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Add club markers (amber/orange color to distinguish from events)
    clubs.forEach((club) => {
      const el = document.createElement('div');
      el.className = 'club-marker';

      const wrapper = document.createElement('div');
      wrapper.className = 'relative cursor-pointer group';

      const ring = document.createElement('div');
      ring.className = 'absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-30';

      const circle = document.createElement('div');
      circle.className = 'relative w-3 h-3 rounded-full bg-amber-500 flex items-center justify-center shadow-lg';
      circle.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.5)';

      wrapper.appendChild(ring);
      wrapper.appendChild(circle);
      el.appendChild(wrapper);

      el.addEventListener('click', () => {
        if (onClubSelect) {
          onClubSelect(club);
        } else if (club.google_maps_uri) {
          window.open(club.google_maps_uri, '_blank', 'noopener,noreferrer');
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([club.longitude, club.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [events, clubs, onEventSelect, onClubSelect]);

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
