import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, AppState } from 'react-native';
import { API_URL, sendLocation, sendMotionVariance } from './api';

// ============================================================
// Constants
// ============================================================

export const BACKGROUND_LOCATION_TASK = 'NIRBHAY_BACKGROUND_LOCATION';



// Speed-based panic detection thresholds
const PANIC_SPEED_THRESHOLD = 22; // m/s (~80 km/h) - unusually fast for walking/auto
const SUDDEN_STOP_SPEED = 1;      // m/s - nearly stopped
const MIN_POINTS_FOR_ANALYSIS = 3;
const SPEED_HISTORY_KEY = 'bg_speed_history';
const ACTIVE_TRIP_KEY = 'bg_active_trip_id';
const BG_RISK_FLAG_KEY = 'bg_risk_detected';
const BG_TRACKING_ENABLED_KEY = 'bg_tracking_enabled';

// ============================================================
// Utility: Haversine distance (meters)
// ============================================================

function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// Speed history helpers (persist across task invocations)
// ============================================================

interface SpeedPoint {
  speed: number;    // m/s
  lat: number;
  lng: number;
  timestamp: number; // epoch ms
}

async function pushSpeedPoint(point: SpeedPoint): Promise<SpeedPoint[]> {
  try {
    const raw = await AsyncStorage.getItem(SPEED_HISTORY_KEY);
    const history: SpeedPoint[] = raw ? JSON.parse(raw) : [];
    history.push(point);
    // Keep last 20 points max
    const trimmed = history.slice(-20);
    await AsyncStorage.setItem(SPEED_HISTORY_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [point];
  }
}

async function clearSpeedHistory(): Promise<void> {
  await AsyncStorage.removeItem(SPEED_HISTORY_KEY);
}

// ============================================================
// Risk detection from speed pattern
// ============================================================

function analyseSpeedPattern(history: SpeedPoint[]): {
  isRisky: boolean;
  rule: string | null;
  confidence: number;
} {
  if (history.length < MIN_POINTS_FOR_ANALYSIS) {
    return { isRisky: false, rule: null, confidence: 0 };
  }

  const recent = history.slice(-6); // last ~30 seconds (5s intervals)

  // Rule 1: High-speed movement then sudden stop
  // (e.g., person put in a vehicle that then parks)
  const highSpeedPoints = recent.filter((p) => p.speed > PANIC_SPEED_THRESHOLD);
  const lastPoint = recent[recent.length - 1];
  const stoppedNow = lastPoint.speed < SUDDEN_STOP_SPEED;

  if (highSpeedPoints.length >= 2 && stoppedNow) {
    return {
      isRisky: true,
      rule: 'HIGH_SPEED_THEN_STOP',
      confidence: 0.75,
    };
  }

  // Rule 2: Erratic speed (large variance) — jerky movement pattern
  const speeds = recent.map((p) => p.speed);
  const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const variance =
    speeds.reduce((sum, s) => sum + (s - avgSpeed) ** 2, 0) / speeds.length;

  if (variance > 100 && avgSpeed > 5) {
    // high variance + meaningful movement
    return {
      isRisky: true,
      rule: 'ERRATIC_MOVEMENT',
      confidence: 0.6,
    };
  }

  // Rule 3: Night-time movement (10 PM - 5 AM) with moderate speed
  const hour = new Date(lastPoint.timestamp).getHours();
  const isNight = hour >= 22 || hour < 5;
  if (isNight && avgSpeed > 8) {
    return {
      isRisky: true,
      rule: 'NIGHT_MOVEMENT',
      confidence: 0.55,
    };
  }

  return { isRisky: false, rule: null, confidence: 0 };
}

// ============================================================
// Send data to backend
// ============================================================

async function sendLocationToBackend(
  tripId: string,
  lat: number,
  lng: number,
  accuracy: number,
  source: string = 'gps'
): Promise<void> {
  await sendLocation(tripId, { latitude: lat, longitude: lng, accuracy, source });
}

async function sendMotionEventToBackend(
  tripId: string,
  accelVariance: number,
  gyroVariance: number
): Promise<void> {
  await sendMotionVariance(tripId, accelVariance, gyroVariance);
}

async function triggerBackendAlert(tripId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/api/trips/${tripId}/test-alert`, {
      method: 'POST',
    });
  } catch (err) {
    console.error('[BG] Failed to trigger backend alert:', err);
  }
}

// ============================================================
// Flag risk for foreground to pick up
// ============================================================

export async function flagBackgroundRisk(rule: string): Promise<void> {
  await AsyncStorage.setItem(
    BG_RISK_FLAG_KEY,
    JSON.stringify({ rule, timestamp: Date.now() })
  );
}

export async function consumeBackgroundRisk(): Promise<{
  rule: string;
  timestamp: number;
} | null> {
  try {
    const raw = await AsyncStorage.getItem(BG_RISK_FLAG_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(BG_RISK_FLAG_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ============================================================
// Define the background task (MUST be called at global scope)
// ============================================================

export function registerBackgroundTask(): void {
  if (Platform.OS === 'web') return;

  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error('[BG] Background location task error:', error);
      return;
    }

    const tripId = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
    if (!tripId) {
      console.log('[BG] No active trip, ignoring background location');
      return;
    }

    const locationData = data as { locations: Location.LocationObject[] };
    if (!locationData?.locations?.length) return;

    for (const loc of locationData.locations) {
      const { latitude, longitude, accuracy, speed } = loc.coords;
      const timestamp = loc.timestamp;

      console.log(
        `[BG] Location: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} ` +
          `speed=${speed?.toFixed(1)} m/s, accuracy=${accuracy?.toFixed(0)}m`
      );

      // 1. Send location to backend
      await sendLocationToBackend(
        tripId,
        latitude,
        longitude,
        accuracy ?? 0,
        'gps'
      );

      // 2. Track speed for pattern analysis
      const speedMs = speed != null && speed >= 0 ? speed : 0;
      const history = await pushSpeedPoint({
        speed: speedMs,
        lat: latitude,
        lng: longitude,
        timestamp,
      });

      // 3. Analyse speed pattern for risk
      const analysis = analyseSpeedPattern(history);

      if (analysis.isRisky && analysis.rule) {
        console.warn(
          `[BG] ⚠️ RISK DETECTED: ${analysis.rule} (confidence: ${analysis.confidence})`
        );

        // Send synthetic panic motion event to backend
        // Use high values to trigger backend panic detection
        await sendMotionEventToBackend(tripId, 25.0, 8.0);

        // Trigger backend alert
        await triggerBackendAlert(tripId);

        // Flag for foreground (SafetyCheckModal)
        await flagBackgroundRisk(analysis.rule);
      }
    }
  });
}

// ============================================================
// Start / Stop background tracking
// ============================================================

export async function startBackgroundTracking(tripId: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[BG] Background tracking not available on web');
    return false;
  }

  try {
    // Check permissions
    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== 'granted') {
      console.error('[BG] Foreground location permission not granted');
      return false;
    }

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== 'granted') {
      console.error('[BG] Background location permission not granted');
      return false;
    }

    // Persist trip ID for background task access
    await AsyncStorage.setItem(ACTIVE_TRIP_KEY, tripId);
    await AsyncStorage.setItem(BG_TRACKING_ENABLED_KEY, 'true');
    await clearSpeedHistory();

    // Check if already running
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRunning) {
      console.log('[BG] Background tracking already running');
      return true;
    }

    // Start background location updates
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,        // every 5 seconds
      distanceInterval: 5,       // or every 5 meters
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: '🛡️ Nirbhay Safety Active',
        notificationBody: 'Your trip is being monitored for safety',
        notificationColor: '#ff4757',
      },
    });

    console.log('[BG] ✅ Background tracking started for trip:', tripId);
    return true;
  } catch (err) {
    console.error('[BG] Failed to start background tracking:', err);
    return false;
  }
}

export async function stopBackgroundTracking(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
    await AsyncStorage.setItem(BG_TRACKING_ENABLED_KEY, 'false');
    await clearSpeedHistory();
    await AsyncStorage.removeItem(BG_RISK_FLAG_KEY);

    console.log('[BG] ✅ Background tracking stopped');
  } catch (err) {
    console.error('[BG] Failed to stop background tracking:', err);
  }
}

export async function isBackgroundTrackingActive(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    );
  } catch {
    return false;
  }
}
