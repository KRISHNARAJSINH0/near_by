'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { Navigation, Loader2 } from 'lucide-react';

export default function MapView({ polls = [], radius = 10, onMarkerClick }) {
  const { location, isMockLocation } = useLocation();
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const radiusCircleRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mapInstance;
    let L;

    const initMap = async () => {
      L = await import('leaflet');
      
      if (!mapContainerRef.current) return;

      // Prevent double initialization if map is already bound
      if (mapRef.current || mapContainerRef.current._leaflet_id) {
        return;
      }

      // Create Leaflet map instance
      mapInstance = L.map(mapContainerRef.current, {
        zoomControl: false, // Custom position zoom control
        attributionControl: false
      }).setView([location.latitude, location.longitude], 12);

      // Add stunning CartoDB Dark Matter tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(mapInstance);

      // Add scale indicator
      L.control.scale({ position: 'bottomright' }).addTo(mapInstance);

      // Custom zoom buttons placement
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstance);

      // Create Layer Group for dynamically rendering markers
      const layerGroup = L.layerGroup().addTo(mapInstance);

      mapRef.current = mapInstance;
      layerGroupRef.current = layerGroup;
      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update user marker, radius circle, and view when user location shifts
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const updateView = async () => {
      const L = await import('leaflet');
      const map = mapRef.current;
      const { latitude, longitude } = location;

      // Pan to active coordinates
      map.setView([latitude, longitude], map.getZoom());

      // Update/Create User Pin
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([latitude, longitude]);
      } else {
        const userIcon = L.divIcon({
          html: `
            <div class="relative w-10 h-10 flex items-center justify-center">
              <div class="absolute w-8 h-8 rounded-full bg-violet-600/30 animate-ping"></div>
              <div class="w-5 h-5 rounded-full bg-violet-500 border-2 border-white flex items-center justify-center shadow-2xl">
                <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          `,
          className: 'user-location-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
          .addTo(map)
          .bindPopup(`<span class="text-xs font-bold text-white px-1">📍 You are here</span>`);
      }

      // Update/Create Proximity Circle representation
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setLatLng([latitude, longitude]);
        radiusCircleRef.current.setRadius(radius * 1000); // converted to meters
      } else {
        radiusCircleRef.current = L.circle([latitude, longitude], {
          color: '#8b5cf6', // Violet
          fillColor: '#8b5cf6',
          fillOpacity: 0.08,
          weight: 1.5,
          dashArray: '4, 4',
          radius: radius * 1000
        }).addTo(map);
      }
    };

    updateView();
  }, [location, radius, mapLoaded]);

  // Update Poll Markers on coordinate updates
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !layerGroupRef.current) return;

    const renderMarkers = async () => {
      const L = await import('leaflet');
      const layerGroup = layerGroupRef.current;
      layerGroup.clearLayers();

      polls.forEach((poll) => {
        const { id, title, description, category, latitude, longitude, distance } = poll;
        if (latitude === undefined || longitude === undefined) return;

        // Custom category coloring
        let colorClass = 'bg-purple-500';
        let badgeColor = 'text-purple-400 border-purple-500/20';
        if (category === 'hackathon') {
          colorClass = 'bg-emerald-500';
          badgeColor = 'text-emerald-400 border-emerald-500/20';
        } else if (category === 'freelance') {
          colorClass = 'bg-indigo-500';
          badgeColor = 'text-indigo-400 border-indigo-500/20';
        } else if (category === 'college') {
          colorClass = 'bg-amber-500';
          badgeColor = 'text-amber-400 border-amber-500/20';
        }

        const customIcon = L.divIcon({
          html: `
            <div class="relative w-8 h-8 flex items-center justify-center">
              <div class="marker-ripple absolute w-full h-full rounded-full ${colorClass} opacity-30"></div>
              <div class="w-4.5 h-4.5 rounded-full ${colorClass} border border-zinc-950 flex items-center justify-center shadow-lg z-10 transition-transform hover:scale-125 duration-200">
                <span class="w-1.5 h-1.5 bg-white rounded-full"></span>
              </div>
            </div>
          `,
          className: `custom-marker-${id}`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([latitude, longitude], { icon: customIcon })
          .addTo(layerGroup)
          .bindPopup(`
            <div class="p-2 min-w-[200px] text-zinc-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-white/5 border ${badgeColor} inline-block">
                  ${category}
                </span>
                <span class="text-[10px] text-zinc-500 font-semibold">📍 ${distance} km</span>
              </div>
              <h3 class="text-xs font-bold text-white mb-1 leading-tight">${title}</h3>
              <p class="text-[11px] text-zinc-400 mb-3 line-clamp-2">${description}</p>
              <div class="flex items-center justify-end border-t border-white/5 pt-2">
                <a href="/team/${id}" class="text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors">
                  Open Workspace &rarr;
                </a>
              </div>
            </div>
          `);

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(poll));
        }
      });
    };

    renderMarkers();
  }, [polls, mapLoaded]);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-white/8 bg-zinc-950 shadow-2xl">
      {/* Map Target Div */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Indicators */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          <span className="text-sm font-semibold text-zinc-400">Booting Proximity Map Engine...</span>
        </div>
      )}

      {/* Preset Location Indicator HUD */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 bg-zinc-900/80 backdrop-blur-md border border-white/8 rounded-xl px-3 py-2 flex items-center gap-2 shadow-lg z-10">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-zinc-300 tracking-wide uppercase flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-violet-400" />
            Scanner Online
          </span>
        </div>
      )}
    </div>
  );
}
