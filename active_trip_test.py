#!/usr/bin/env python3
"""
Quick Fix Test for Location and Motion Tracking on Active Trip
This test creates a new active trip and tests location/motion features
"""

import asyncio
import httpx
import json
from datetime import datetime
from pathlib import Path

def get_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    return "http://localhost:8001"

API_BASE = get_backend_url()

async def test_active_trip_features():
    """Test location and motion on a new active trip"""
    print("🚀 Testing Location & Motion on Active Trip...")
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            
            # Create new active trip
            print("\n📝 Creating new active trip...")
            create_data = {
                "user_id": "test_user_active",
                "guardian_phone": "+919876543210"
            }
            
            response = await client.post(f"{API_BASE}/trips", json=create_data)
            if response.status_code != 200:
                print(f"❌ Failed to create trip: {response.status_code}")
                return
            
            trip = response.json()
            trip_id = trip["id"]
            print(f"✅ Active trip created: {trip_id}")
            
            # Test Location Tracking on Active Trip
            print("\n📍 Testing GPS location on active trip...")
            gps_location = {
                "trip_id": trip_id,
                "latitude": 28.6139,
                "longitude": 77.2090,
                "accuracy": 15.5,
                "source": "gps"
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/location", json=gps_location)
            if response.status_code == 200:
                print(f"✅ GPS location added successfully")
                
                # Verify location stored
                trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
                if trip_response.status_code == 200:
                    trip_data = trip_response.json()
                    locations = trip_data.get("locations", [])
                    print(f"✅ {len(locations)} location(s) stored in trip")
                    if locations:
                        last_loc = locations[-1]
                        print(f"   📍 Last location: ({last_loc['latitude']}, {last_loc['longitude']})")
            else:
                print(f"❌ GPS location failed: {response.status_code} - {response.text}")
            
            # Test Motion Detection on Active Trip
            print("\n🏃 Testing motion detection on active trip...")
            
            # Normal motion
            normal_motion = {
                "trip_id": trip_id,
                "accel_variance": 1.5,
                "gyro_variance": 0.3
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=normal_motion)
            if response.status_code == 200:
                motion_result = response.json()
                print(f"✅ Normal motion: {motion_result.get('message')} (panic: {motion_result.get('is_panic')})")
            else:
                print(f"❌ Normal motion failed: {response.status_code} - {response.text}")
            
            # Panic motion
            panic_motion = {
                "trip_id": trip_id,
                "accel_variance": 5.0,
                "gyro_variance": 1.5
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=panic_motion)
            if response.status_code == 200:
                panic_result = response.json()
                print(f"✅ Panic motion: {panic_result.get('message')} (panic: {panic_result.get('is_panic')})")
                
                # Wait for risk evaluation
                print("   ⏳ Waiting for risk evaluation...")
                await asyncio.sleep(3)
                
                # Check for risk events
                trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
                if trip_response.status_code == 200:
                    trip_data = trip_response.json()
                    motion_events = trip_data.get("motion_events", [])
                    risk_events = trip_data.get("risk_events", [])
                    
                    print(f"   📊 Motion events stored: {len(motion_events)}")
                    print(f"   ⚠️ Risk events generated: {len(risk_events)}")
                    
                    if len(risk_events) > 0:
                        last_risk = risk_events[-1]
                        print(f"   🚨 Last risk: {last_risk.get('rule_name')} (confidence: {last_risk.get('confidence')})")
                    
                    # Check debug info
                    debug_response = await client.get(f"{API_BASE}/trips/{trip_id}/debug")
                    if debug_response.status_code == 200:
                        debug_data = debug_response.json()
                        print(f"   🔍 Debug status: {debug_data.get('motion_status')}")
                        print(f"   📍 Tracking source: {debug_data.get('tracking_source')}")
                        print(f"   🎯 Total locations: {debug_data.get('total_locations')}")
                        print(f"   🏃 Total motion events: {debug_data.get('total_motion_events')}")
            else:
                print(f"❌ Panic motion failed: {response.status_code} - {response.text}")
            
            # Add more panic events to trigger sustained panic
            print("\n🔥 Testing sustained panic detection...")
            for i in range(3):
                sustained_panic = {
                    "trip_id": trip_id,
                    "accel_variance": 6.0 + i,
                    "gyro_variance": 2.0 + i * 0.3
                }
                
                response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=sustained_panic)
                if response.status_code == 200:
                    print(f"   ✅ Panic motion {i+1} added")
                else:
                    print(f"   ❌ Panic motion {i+1} failed")
                
                await asyncio.sleep(0.5)
            
            # Wait for risk evaluation
            print("   ⏳ Waiting for sustained panic risk evaluation...")
            await asyncio.sleep(5)
            
            # Check final trip state
            trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
            if trip_response.status_code == 200:
                trip_data = trip_response.json()
                risk_events = trip_data.get("risk_events", [])
                
                print(f"\n📋 Final Trip Status:")
                print(f"   Status: {trip_data.get('status')}")
                print(f"   Total risk events: {len(risk_events)}")
                
                if len(risk_events) > 0:
                    for i, risk in enumerate(risk_events):
                        print(f"   Risk {i+1}: {risk.get('rule_name')} (confidence: {risk.get('confidence')})")
                        print(f"            Alerts - SMS: {risk.get('sms_sent')}, Push: {risk.get('push_sent')}")
                
                # Test alert system
                print(f"\n📱 Testing alert system...")
                alert_response = await client.post(f"{API_BASE}/trips/{trip_id}/test-alert")
                if alert_response.status_code == 200:
                    alert_result = alert_response.json()
                    print(f"   ✅ Test alert: SMS={alert_result.get('sms_sent')}, Push={alert_result.get('push_sent')}")
                else:
                    print(f"   ❌ Test alert failed: {alert_response.status_code}")
            
            # Keep trip active (don't end it)
            print(f"\n✅ Trip {trip_id} remains active for further testing")
            
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_active_trip_features())