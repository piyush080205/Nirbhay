import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface SafetyFactor {
  name: string;
  score: number;
  description: string;
  icon: string;
}

interface TransportMode {
  mode: string;
  safety_score: number;
  estimated_time: number;
  recommendation: string;
  icon: string;
}

interface SafeSpot {
  name: string;
  type: string;
  icon: string;
  lat: number;
  lng: number;
  distance_m: number;
}

interface RouteAnalysis {
  overall_safety_score: number;
  safety_level: string;
  factors: SafetyFactor[];
  transport_modes: TransportMode[];
  route_points: any[];
  recommendations: string[];
  nearby_safe_spots: SafeSpot[];
}

interface GeocodeResult {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  type: string;
}

export default function SafeRoutesScreen() {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const [destinationText, setDestinationText] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<GeocodeResult | null>(null);
  const [searching, setSearching] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setCurrentLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error('Location error:', error);
      setLocationError('Could not get current location');
      // Set default Delhi location as fallback
      setCurrentLocation({ lat: 28.6139, lng: 77.2090 });
    } finally {
      setLocationLoading(false);
    }
  };

  // Search for places with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (destinationText.length >= 3) {
        searchPlaces(destinationText);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [destinationText]);

  const searchPlaces = async (query: string) => {
    setSearching(true);
    try {
      const response = await fetch(
        `${API_URL}/api/geocode/search?q=${encodeURIComponent(query)}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectDestination = (result: GeocodeResult) => {
    setSelectedDestination(result);
    setDestinationText(result.name);
    setSearchResults([]);
  };

  const analyzeRoute = async () => {
    if (!currentLocation) {
      Alert.alert('Location Required', 'Please wait for your current location or tap to refresh.');
      return;
    }

    if (!selectedDestination && destinationText.length < 3) {
      Alert.alert('Destination Required', 'Please enter a destination.');
      return;
    }

    setLoading(true);
    try {
      const requestBody: any = {
        origin_lat: currentLocation.lat,
        origin_lng: currentLocation.lng,
      };

      if (selectedDestination) {
        requestBody.dest_lat = selectedDestination.lat;
        requestBody.dest_lng = selectedDestination.lng;
      } else {
        requestBody.dest_place_name = destinationText;
      }

      const response = await fetch(`${API_URL}/api/routes/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to analyze route');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error: any) {
      console.error('Route analysis error:', error);
      Alert.alert('Error', error.message || 'Failed to analyze route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'safe': return '#2ed573';
      case 'moderate': return '#f39c12';
      case 'risky': return '#ff4757';
      default: return '#888';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2ed573';
    if (score >= 60) return '#f39c12';
    return '#ff4757';
  };

  const getIconName = (iconKey: string): any => {
    const iconMap: Record<string, string> = {
      'time': 'time-outline',
      'people': 'people-outline',
      'bulb': 'bulb-outline',
      'shield': 'shield-checkmark-outline',
      'location': 'location-outline',
      'walk': 'walk-outline',
      'train': 'train-outline',
      'bus': 'bus-outline',
      'car': 'car-outline',
      'car-sport': 'car-sport-outline',
      'shield-checkmark': 'shield-checkmark',
      'medical': 'medical-outline',
      'flame': 'flame-outline',
    };
    return iconMap[iconKey] || 'help-outline';
  };

  const renderMapHtml = () => {
    if (!analysis || !currentLocation) return '';
    
    const origin = { lat: currentLocation.lat, lng: currentLocation.lng };
    const dest = analysis.route_points[1];
    const safeSpots = analysis.nearby_safe_spots || [];
    const safetyColor = getSafetyColor(analysis.safety_level);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #0f0f0f; }
          #map { width: 100%; height: 100vh; }
          .leaflet-routing-container { display: none !important; }
          .route-info {
            position: absolute; bottom: 10px; left: 10px; right: 10px; z-index: 1000;
            background: rgba(15,15,15,0.92); backdrop-filter: blur(10px);
            border-radius: 12px; padding: 10px 14px;
            display: flex; justify-content: space-around; align-items: center;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .route-info .item { text-align: center; }
          .route-info .label { color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
          .route-info .value { color: #fff; font-size: 16px; font-weight: 700; margin-top: 2px; }
          .route-info .divider { width: 1px; height: 30px; background: rgba(255,255,255,0.15); }
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }
          .origin-pulse {
            width: 24px; height: 24px; border-radius: 50%;
            background: rgba(46,213,115,0.3); position: absolute;
            animation: pulse 1.5s ease-out infinite;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <div class="route-info" id="routeInfo" style="display:none;">
          <div class="item">
            <div class="label">Distance</div>
            <div class="value" id="distance">—</div>
          </div>
          <div class="divider"></div>
          <div class="item">
            <div class="label">Est. Time</div>
            <div class="value" id="duration">—</div>
          </div>
          <div class="divider"></div>
          <div class="item">
            <div class="label">Safety</div>
            <div class="value" id="safety" style="color:${safetyColor};">${analysis.overall_safety_score.toFixed(0)}%</div>
          </div>
        </div>
        <script>
          var map = L.map('map', { zoomControl: false }).setView(
            [${(origin.lat + dest.lat) / 2}, ${(origin.lng + dest.lng) / 2}], 13
          );

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OSM'
          }).addTo(map);

          // Custom origin marker (green with pulse effect)
          var originIcon = L.divIcon({
            className: '',
            html: '<div style="position:relative;width:24px;height:24px;">' +
                  '<div class="origin-pulse"></div>' +
                  '<div style="width:14px;height:14px;border-radius:50%;background:#2ed573;border:3px solid #fff;position:absolute;top:5px;left:5px;box-shadow:0 0 8px rgba(46,213,115,0.6);"></div>' +
                  '</div>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          L.marker([${origin.lat}, ${origin.lng}], { icon: originIcon })
            .addTo(map).bindPopup('<b>Your Location</b>');

          // Custom destination marker (red pin)
          var destIcon = L.divIcon({
            className: '',
            html: '<div style="position:relative;width:24px;height:34px;">' +
                  '<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#ff4757;border:3px solid #fff;transform:rotate(-45deg);box-shadow:0 0 8px rgba(255,71,87,0.6);"></div>' +
                  '<div style="width:6px;height:6px;border-radius:50%;background:#fff;position:absolute;top:9px;left:9px;"></div>' +
                  '</div>',
            iconSize: [24, 34],
            iconAnchor: [12, 34]
          });
          L.marker([${dest.lat}, ${dest.lng}], { icon: destIcon })
            .addTo(map).bindPopup('<b>Destination</b>');

          // Safe spots markers
          ${safeSpots.map(spot => `
            L.circleMarker([${spot.lat}, ${spot.lng}], {
              radius: 7, fillColor: '#3498db', color: '#fff', weight: 2, fillOpacity: 0.85
            }).addTo(map).bindPopup('<b>${spot.name.replace(/'/g, "\\'")}</b><br>${spot.distance_m}m away');
          `).join('')}

          // Road-based routing with OSRM via Leaflet Routing Machine
          var routingControl = L.Routing.control({
            waypoints: [
              L.latLng(${origin.lat}, ${origin.lng}),
              L.latLng(${dest.lat}, ${dest.lng})
            ],
            router: L.Routing.osrmv1({
              serviceUrl: 'https://router.project-osrm.org/route/v1'
            }),
            lineOptions: {
              styles: [
                { color: '#1a1a2e', weight: 8, opacity: 0.4 },
                { color: '${safetyColor}', weight: 5, opacity: 0.9 }
              ],
              addWaypoints: false,
              missingRouteTolerance: 0
            },
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            show: false,
            createMarker: function() { return null; }
          }).addTo(map);

          routingControl.on('routesfound', function(e) {
            var route = e.routes[0];
            var distKm = (route.summary.totalDistance / 1000).toFixed(1);
            var durMin = Math.round(route.summary.totalTime / 60);

            document.getElementById('distance').textContent = distKm + ' km';
            document.getElementById('duration').textContent = durMin + ' min';
            document.getElementById('routeInfo').style.display = 'flex';

            // Fit map to route bounds with padding
            var bounds = L.latLngBounds(route.coordinates);
            map.fitBounds(bounds, { padding: [40, 40] });
          });

          routingControl.on('routingerror', function(e) {
            // Fallback: draw straight line if routing fails
            L.polyline(
              [[${origin.lat}, ${origin.lng}], [${dest.lat}, ${dest.lng}]],
              { color: '${safetyColor}', weight: 5, opacity: 0.8, dashArray: '10, 10' }
            ).addTo(map);
            map.fitBounds([[${origin.lat}, ${origin.lng}], [${dest.lat}, ${dest.lng}]], { padding: [40, 40] });
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Safe Routes</Text>
            <Text style={styles.subtitle}>Find the safest way to travel</Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* Current Location (From) */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="navigate" size={20} color="#2ed573" />
              <Text style={styles.labelText}>From (Current Location)</Text>
            </View>
            <TouchableOpacity 
              style={styles.locationBox}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <View style={styles.locationContent}>
                  <ActivityIndicator size="small" color="#2ed573" />
                  <Text style={styles.locationText}>Getting location...</Text>
                </View>
              ) : currentLocation ? (
                <View style={styles.locationContent}>
                  <Ionicons name="checkmark-circle" size={20} color="#2ed573" />
                  <Text style={styles.locationText}>
                    {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                  </Text>
                  <Ionicons name="refresh" size={18} color="#888" />
                </View>
              ) : (
                <View style={styles.locationContent}>
                  <Ionicons name="alert-circle" size={20} color="#ff4757" />
                  <Text style={styles.locationTextError}>
                    {locationError || 'Tap to get location'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Destination (To) */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabel}>
              <Ionicons name="flag" size={20} color="#ff4757" />
              <Text style={styles.labelText}>To (Destination)</Text>
            </View>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a place..."
                placeholderTextColor="#666"
                value={destinationText}
                onChangeText={(text) => {
                  setDestinationText(text);
                  setSelectedDestination(null);
                }}
              />
              {searching && (
                <ActivityIndicator size="small" color="#3498db" style={styles.searchSpinner} />
              )}
              {selectedDestination && (
                <Ionicons name="checkmark-circle" size={20} color="#2ed573" style={styles.selectedIcon} />
              )}
            </View>
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <View style={styles.searchResults}>
                {searchResults.map((result, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.searchResultItem}
                    onPress={() => selectDestination(result)}
                  >
                    <Ionicons name="location-outline" size={18} color="#3498db" />
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultName}>{result.name}</Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>
                        {result.display_name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Analyze Button */}
          <TouchableOpacity
            style={[styles.analyzeButton, (!currentLocation || (!selectedDestination && destinationText.length < 3)) && styles.analyzeButtonDisabled]}
            onPress={analyzeRoute}
            disabled={loading || !currentLocation || (!selectedDestination && destinationText.length < 3)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={24} color="#fff" />
                <Text style={styles.analyzeButtonText}>Analyze Safety</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {analysis && (
          <>
            {/* Map */}
            <View style={styles.mapContainer}>
              <WebView
                source={{ html: renderMapHtml() }}
                style={styles.map}
                scrollEnabled={false}
              />
            </View>

            {/* Overall Score */}
            <View style={[styles.scoreCard, { borderColor: getSafetyColor(analysis.safety_level) }]}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreTitle}>Safety Score</Text>
                <View style={[styles.levelBadge, { backgroundColor: getSafetyColor(analysis.safety_level) }]}>
                  <Text style={styles.levelText}>{analysis.safety_level.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={[styles.scoreValue, { color: getSafetyColor(analysis.safety_level) }]}>
                {analysis.overall_safety_score.toFixed(0)}
              </Text>
              <Text style={styles.scoreMax}>/ 100</Text>
            </View>

            {/* Safety Factors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Safety Factors</Text>
              {analysis.factors.map((factor, idx) => (
                <View key={idx} style={styles.factorCard}>
                  <View style={styles.factorHeader}>
                    <Ionicons name={getIconName(factor.icon)} size={20} color="#3498db" />
                    <Text style={styles.factorName}>{factor.name}</Text>
                    <Text style={[styles.factorScore, { color: getScoreColor(factor.score) }]}>
                      {factor.score}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { 
                      width: `${factor.score}%`,
                      backgroundColor: getScoreColor(factor.score)
                    }]} />
                  </View>
                  <Text style={styles.factorDesc}>{factor.description}</Text>
                </View>
              ))}
            </View>

            {/* Transport Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transport Options</Text>
              {analysis.transport_modes.map((mode, idx) => (
                <View key={idx} style={styles.transportCard}>
                  <View style={styles.transportHeader}>
                    <View style={styles.transportIconContainer}>
                      <Ionicons name={getIconName(mode.icon)} size={24} color="#fff" />
                    </View>
                    <View style={styles.transportInfo}>
                      <Text style={styles.transportMode}>{mode.mode.toUpperCase()}</Text>
                      <Text style={styles.transportTime}>{mode.estimated_time} min</Text>
                    </View>
                    <View style={[styles.transportScoreBadge, { backgroundColor: getScoreColor(mode.safety_score) }]}>
                      <Text style={styles.transportScoreText}>{mode.safety_score.toFixed(0)}</Text>
                    </View>
                  </View>
                  <Text style={styles.transportRec}>{mode.recommendation}</Text>
                </View>
              ))}
            </View>

            {/* Nearby Safe Spots */}
            {analysis.nearby_safe_spots.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nearby Safe Spots</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {analysis.nearby_safe_spots.map((spot, idx) => (
                    <View key={idx} style={styles.safeSpotCard}>
                      <Ionicons name={getIconName(spot.icon)} size={24} color="#3498db" />
                      <Text style={styles.safeSpotName} numberOfLines={1}>{spot.name}</Text>
                      <Text style={styles.safeSpotDistance}>{spot.distance_m}m away</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              <View style={styles.recsCard}>
                {analysis.recommendations.map((rec, idx) => (
                  <View key={idx} style={styles.recItem}>
                    <Ionicons name="checkmark-circle" size={18} color="#2ed573" />
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  labelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  locationBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  locationTextError: {
    color: '#ff4757',
    fontSize: 14,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 14,
  },
  searchSpinner: {
    marginLeft: 8,
  },
  selectedIcon: {
    marginLeft: 8,
  },
  searchResults: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 10,
  },
  resultTextContainer: {
    flex: 1,
  },
  resultName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  resultAddress: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#555',
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  map: {
    flex: 1,
  },
  scoreCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  scoreTitle: {
    color: '#888',
    fontSize: 14,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreMax: {
    color: '#666',
    fontSize: 18,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  factorCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  factorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  factorName: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  factorScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  factorDesc: {
    color: '#888',
    fontSize: 12,
  },
  transportCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transportInfo: {
    flex: 1,
  },
  transportMode: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transportTime: {
    color: '#888',
    fontSize: 12,
  },
  transportScoreBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportScoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transportRec: {
    color: '#888',
    fontSize: 12,
  },
  safeSpotCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
  },
  safeSpotName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  safeSpotDistance: {
    color: '#888',
    fontSize: 11,
    marginTop: 4,
  },
  recsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
  },
  recItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  recText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
});
