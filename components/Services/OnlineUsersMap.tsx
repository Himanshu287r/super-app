"use client";

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { subscribeToOnlineUsers, updateUserLocation, UserProfile } from '@/lib/services/userService';
import styles from './OnlineUsersMap.module.css';

// Declare Leaflet types
declare global {
    interface Window {
        L: any;
    }
}

export default function OnlineUsersMap() {
    const { user } = useAuth();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
    const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [locationError, setLocationError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const watchIdRef = useRef<number | null>(null);

    // Initialize map
    const initializeMap = () => {
        if (!mapRef.current || !window.L || mapInstanceRef.current) return;

        // Initialize map centered at a default location (can be updated when user location is available)
        const map = window.L.map(mapRef.current).setView([20, 0], 2);

        // Add OpenStreetMap tiles
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsLoading(false);
    };

    // Load Leaflet CSS and JS
    useEffect(() => {
        // Check if Leaflet is already loaded
        if (window.L && mapRef.current) {
            initializeMap();
            return;
        }

        // Check if CSS is already loaded
        const existingCSS = document.querySelector('link[href*="leaflet"]');
        if (!existingCSS) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);
        }

        // Check if script is already loaded
        const existingScript = document.querySelector('script[src*="leaflet"]');
        if (existingScript) {
            if (window.L && mapRef.current) {
                initializeMap();
            }
            return;
        }

        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        script.onload = () => {
            if (mapRef.current) {
                initializeMap();
            }
        };
        document.body.appendChild(script);

        return () => {
            // Cleanup
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            markersRef.current.clear();
        };
    }, []);

    // Request location permission and start tracking
    useEffect(() => {
        if (!user || !navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser');
            return;
        }

        const requestLocation = () => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationPermission('granted');
                    setLocationError(null);
                    const { latitude, longitude } = position.coords;
                    
                    // Update user location in Firestore
                    updateUserLocation(user.uid, latitude, longitude);

                    // Center map on user location
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([latitude, longitude], 13);
                        
                        // Add user's own marker
                        if (!markersRef.current.has(user.uid)) {
                            const userIcon = window.L.divIcon({
                                className: styles.userMarker,
                                html: `<div class="${styles.userMarkerDot}"></div>`,
                                iconSize: [20, 20],
                                iconAnchor: [10, 10],
                            });
                            const marker = window.L.marker([latitude, longitude], { icon: userIcon })
                                .addTo(mapInstanceRef.current)
                                .bindPopup(`<strong>You</strong><br>${user.displayName || user.email}`);
                            markersRef.current.set(user.uid, marker);
                        }
                    }

                    // Watch position for updates
                    watchIdRef.current = navigator.geolocation.watchPosition(
                        (pos) => {
                            updateUserLocation(user.uid, pos.coords.latitude, pos.coords.longitude);
                            if (markersRef.current.has(user.uid) && mapInstanceRef.current) {
                                const marker = markersRef.current.get(user.uid);
                                marker.setLatLng([pos.coords.latitude, pos.coords.longitude]);
                            }
                        },
                        (err) => {
                            console.error('Location watch error:', err);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 60000, // Update every minute
                        }
                    );
                },
                (err) => {
                    setLocationPermission('denied');
                    if (err.code === 1) {
                        setLocationError('Location permission denied. Please enable location access to see yourself on the map.');
                    } else {
                        setLocationError('Failed to get your location. Please check your browser settings.');
                    }
                }
            );
        };

        requestLocation();

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [user]);

    // Apply black cursor style to map
    useEffect(() => {
        if (isLoading) return;

        const applyCursorStyle = () => {
            if (!mapRef.current) return;
            const mapContainer = mapRef.current.querySelector('.leaflet-container') as HTMLElement;
            if (mapContainer) {
                // Pure black crosshair cursor
                const crosshairUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="4" fill="black"/><path d="M24 2 L24 12 M24 36 L24 46 M2 24 L12 24 M36 24 L46 24" stroke="black" stroke-width="5" stroke-linecap="round"/></svg>';
                
                // Pure black grab cursor (open hand)
                const grabUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M18 12 C14 12 10 16 10 20 L10 28 C10 32 14 36 18 36 L22 36 L22 32 L18 32 C16 32 14 30 14 28 L14 20 C14 18 16 16 18 16 L30 16 C32 16 34 18 34 20 L34 28 C34 30 32 32 30 32 L26 32 L26 36 L30 36 C34 36 38 32 38 28 L38 20 C38 16 34 12 30 12 Z" fill="black"/><circle cx="18" cy="22" r="2.5" fill="black"/><circle cx="24" cy="22" r="2.5" fill="black"/><circle cx="30" cy="22" r="2.5" fill="black"/></svg>';
                
                // Pure black grabbing cursor (closed hand)
                const grabbingUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M18 12 C14 12 10 16 10 20 L10 28 C10 32 14 36 18 36 L22 36 L22 32 L18 32 C16 32 14 30 14 28 L14 20 C14 18 16 16 18 16 L30 16 C32 16 34 18 34 20 L34 28 C34 30 32 32 30 32 L26 32 L26 36 L30 36 C34 36 38 32 38 28 L38 20 C38 16 34 12 30 12 Z" fill="black"/><rect x="16" y="20" width="4" height="4" fill="black"/><rect x="22" y="20" width="4" height="4" fill="black"/><rect x="28" y="20" width="4" height="4" fill="black"/></svg>';
                
                // Apply default cursor
                mapContainer.style.cursor = `url("${crosshairUrl}") 24 24, crosshair`;
                
                // Create style element for grab/grabbing cursors
                let styleEl = document.getElementById('leaflet-black-cursors');
                if (!styleEl) {
                    styleEl = document.createElement('style');
                    styleEl.id = 'leaflet-black-cursors';
                    document.head.appendChild(styleEl);
                }
                styleEl.textContent = `
                    .leaflet-container.leaflet-grab {
                        cursor: url("${grabUrl}") 24 24, grab !important;
                    }
                    .leaflet-container.leaflet-grabbing {
                        cursor: url("${grabbingUrl}") 24 24, grabbing !important;
                    }
                `;
            }
        };

        // Apply after a short delay to ensure Leaflet has rendered
        const timeout = setTimeout(applyCursorStyle, 200);
        
        // Also apply on map zoom/pan events
        const mapInstance = mapInstanceRef.current;
        if (mapInstance) {
            mapInstance.on('zoomend', applyCursorStyle);
            mapInstance.on('moveend', applyCursorStyle);
            mapInstance.on('zoomstart', applyCursorStyle);
            mapInstance.on('mousedown', applyCursorStyle);
            mapInstance.on('mouseup', applyCursorStyle);
        }

        return () => {
            clearTimeout(timeout);
            const currentMapInstance = mapInstanceRef.current;
            if (currentMapInstance) {
                currentMapInstance.off('zoomend', applyCursorStyle);
                currentMapInstance.off('moveend', applyCursorStyle);
                currentMapInstance.off('zoomstart', applyCursorStyle);
                currentMapInstance.off('mousedown', applyCursorStyle);
                currentMapInstance.off('mouseup', applyCursorStyle);
            }
        };
    }, [isLoading]);

    // Subscribe to online users
    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToOnlineUsers((users) => {
            // Filter out current user
            const otherUsers = users.filter((u) => u.uid !== user.uid);
            setOnlineUsers(otherUsers);
        });

        return () => unsubscribe();
    }, [user]);

    // Update markers when online users change
    useEffect(() => {
        if (!mapInstanceRef.current || !window.L) return;

        // Remove markers for users who are no longer online or don't have location
        const currentUserIds = new Set(onlineUsers.map((u) => u.uid));
        markersRef.current.forEach((marker, userId) => {
            if (userId !== user?.uid && !currentUserIds.has(userId)) {
                mapInstanceRef.current.removeLayer(marker);
                markersRef.current.delete(userId);
            }
        });

        // Add/update markers for online users with locations
        onlineUsers.forEach((userProfile) => {
            if (!userProfile.location) return;

            const { latitude, longitude } = userProfile.location;

            if (markersRef.current.has(userProfile.uid)) {
                // Update existing marker
                const marker = markersRef.current.get(userProfile.uid);
                marker.setLatLng([latitude, longitude]);
                marker.setPopupContent(
                    `<div class="${styles.popupContent}">
                        ${userProfile.photoURL ? `<img src="${userProfile.photoURL}" alt="${userProfile.displayName}" class="${styles.popupAvatar}" />` : ''}
                        <strong>${userProfile.displayName}</strong>
                        ${userProfile.about ? `<p>${userProfile.about}</p>` : ''}
                    </div>`
                );
            } else {
                // Create new marker
                const defaultIcon = window.L.divIcon({
                    className: styles.onlineMarker,
                    html: `<div class="${styles.onlineMarkerDot}"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8],
                });

                const marker = window.L.marker([latitude, longitude], { icon: defaultIcon })
                    .addTo(mapInstanceRef.current)
                    .bindPopup(
                        `<div class="${styles.popupContent}">
                            ${userProfile.photoURL ? `<img src="${userProfile.photoURL}" alt="${userProfile.displayName}" class="${styles.popupAvatar}" />` : ''}
                            <strong>${userProfile.displayName}</strong>
                            ${userProfile.about ? `<p>${userProfile.about}</p>` : ''}
                        </div>`
                    );

                markersRef.current.set(userProfile.uid, marker);
            }
        });
    }, [onlineUsers, user]);

    return (
        <div className={styles.mapContainer}>
            {isLoading && (
                <div className={styles.loading}>
                    <div className={styles.spinner} />
                    <p>Loading map...</p>
                </div>
            )}
            {locationError && (
                <div className={styles.errorBanner}>
                    <p>{locationError}</p>
                </div>
            )}
            <div ref={mapRef} className={styles.map} />
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.userMarkerDot} />
                    <span>You</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.onlineMarkerDot} />
                    <span>Online Users</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.onlineCount}>{onlineUsers.length} online</span>
                </div>
            </div>
        </div>
    );
}
