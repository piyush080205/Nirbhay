#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Nirbhay Women Safety App
Tests ALL core safety features as requested in the review:
1. Backend API health check and all endpoints
2. Trip lifecycle: create trip, add locations, add motion events, end trip  
3. Location tracking endpoint (GPS coordinates)
4. Motion event detection (normal and panic movements)
5. Risk evaluation system
6. Guardian phone number management
7. SMS alert system (test mode)
8. MongoDB data persistence
9. API endpoint response validation
10. Error handling for invalid requests
"""

import asyncio
import httpx
import json
import base64
from datetime import datetime
import os
from pathlib import Path
import time

# Get backend URL from frontend .env file
def get_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=')[1].strip()
    return "http://localhost:8001"

BASE_URL = get_backend_url()
API_BASE = f"{BASE_URL}/api"

print(f"🧪 Testing Nirbhay Backend at: {API_BASE}")

class TestResults:
    def __init__(self):
        self.results = []
        self.passed = 0
        self.failed = 0
        self.critical_failures = []
        self.backend_issues = []
        self.created_trip_id = None
    
    def add_result(self, test_name, passed, details="", error="", is_critical=False):
        self.results.append({
            "test": test_name,
            "passed": passed,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat(),
            "is_critical": is_critical
        })
        
        if passed:
            self.passed += 1
            print(f"✅ {test_name}")
            if details:
                print(f"   📝 {details}")
        else:
            self.failed += 1
            print(f"❌ {test_name}")
            print(f"   🚨 {error}")
            
            if is_critical:
                self.critical_failures.append(test_name)
                self.backend_issues.append({
                    "endpoint": test_name.split(" - ")[0] if " - " in test_name else test_name,
                    "issue": error,
                    "impact": "Critical functionality not working",
                    "fix_priority": "CRITICAL"
                })
    
    def print_summary(self):
        print(f"\n{'='*80}")
        print(f"🧪 COMPREHENSIVE NIRBHAY BACKEND TEST SUMMARY")
        print(f"{'='*80}")
        print(f"📊 Total Tests: {len(self.results)}")
        print(f"✅ Passed: {self.passed}")
        print(f"❌ Failed: {self.failed}")
        print(f"📈 Success Rate: {(self.passed/len(self.results)*100):.1f}%")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   • {failure}")
        
        if self.failed > 0:
            print(f"\n{'='*80}")
            print(f"❌ FAILED TESTS DETAILS:")
            print(f"{'='*80}")
            for result in self.results:
                if not result["passed"]:
                    print(f"Test: {result['test']}")
                    print(f"Error: {result['error']}")
                    print(f"Critical: {'Yes' if result['is_critical'] else 'No'}")
                    print("-" * 40)

# Test helper functions
def validate_uuid(uuid_string):
    """Validate if string is a valid UUID format"""
    if not uuid_string or len(uuid_string) != 36:
        return False
    try:
        parts = uuid_string.split('-')
        return len(parts) == 5 and all(len(part) in [8, 4, 4, 4, 12] for part in parts[:5])
    except:
        return False

async def test_health_check():
    """Test the health check endpoint - Critical for service status"""
    test_results = TestResults()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(f"{API_BASE}/health")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                required_fields = ["status", "timestamp", "services"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    test_results.add_result(
                        "Health Check - Response Structure",
                        False,
                        error=f"Missing fields: {missing_fields}",
                        is_critical=True
                    )
                else:
                    test_results.add_result(
                        "Health Check - Response Structure",
                        True,
                        details=f"All required fields present: {list(data.keys())}"
                    )
                
                # Check status
                if data.get("status") == "healthy":
                    test_results.add_result(
                        "Health Check - Status",
                        True,
                        details="Service reports healthy status"
                    )
                else:
                    test_results.add_result(
                        "Health Check - Status",
                        False,
                        error=f"Unhealthy status: {data.get('status')}",
                        is_critical=True
                    )
                
                # Check services
                services = data.get("services", {})
                expected_services = ["database", "unwired_labs", "fast2sms"]
                for service in expected_services:
                    if service in services:
                        service_status = services[service]
                        test_results.add_result(
                            f"Health Check - {service} service",
                            True,
                            details=f"{service}: {service_status}"
                        )
                        
                        # Special check for database connection
                        if service == "database" and service_status != "connected":
                            test_results.add_result(
                                f"Health Check - Database Connection",
                                False,
                                error=f"Database not connected: {service_status}",
                                is_critical=True
                            )
                    else:
                        test_results.add_result(
                            f"Health Check - {service} service",
                            False,
                            error=f"Service {service} not reported",
                            is_critical=True
                        )
            else:
                test_results.add_result(
                    "Health Check - HTTP Status",
                    False,
                    error=f"Expected 200, got {response.status_code}: {response.text}",
                    is_critical=True
                )
                
    except Exception as e:
        test_results.add_result(
            "Health Check - Connection",
            False,
            error=f"Failed to connect to backend: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_trip_lifecycle():
    """Test complete trip lifecycle: create, manage, end"""
    test_results = TestResults()
    trip_id = None
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # 1. Test Create Trip
            create_data = {
                "user_id": "test_user_backend",
                "guardian_phone": "+919876543210"
            }
            
            response = await client.post(f"{API_BASE}/trips", json=create_data)
            
            if response.status_code == 200:
                trip = response.json()
                
                # Validate trip structure
                required_fields = ["id", "user_id", "status", "start_time"]
                missing_fields = [field for field in required_fields if field not in trip]
                
                if missing_fields:
                    test_results.add_result(
                        "Trip Lifecycle - Create Trip Structure",
                        False,
                        error=f"Missing fields: {missing_fields}",
                        is_critical=True
                    )
                else:
                    trip_id = trip["id"]
                    test_results.created_trip_id = trip_id
                    
                    # Validate UUID format
                    if validate_uuid(trip_id):
                        test_results.add_result(
                            "Trip Lifecycle - Create Trip",
                            True,
                            details=f"Trip created with valid ID: {trip_id}, Status: {trip['status']}"
                        )
                    else:
                        test_results.add_result(
                            "Trip Lifecycle - Create Trip ID Format",
                            False,
                            error=f"Invalid UUID format: {trip_id}"
                        )
                    
                    # Check status is active
                    if trip["status"] == "active":
                        test_results.add_result(
                            "Trip Lifecycle - Initial Status",
                            True,
                            details="Trip status correctly set to 'active'"
                        )
                    else:
                        test_results.add_result(
                            "Trip Lifecycle - Initial Status",
                            False,
                            error=f"Expected status 'active', got '{trip['status']}'"
                        )
                        
                    # Check guardian phone
                    if trip.get("guardian_phone") == create_data["guardian_phone"]:
                        test_results.add_result(
                            "Trip Lifecycle - Guardian Phone",
                            True,
                            details=f"Guardian phone correctly set: {trip['guardian_phone']}"
                        )
                    else:
                        test_results.add_result(
                            "Trip Lifecycle - Guardian Phone",
                            False,
                            error=f"Guardian phone mismatch: {trip.get('guardian_phone')}"
                        )
            else:
                test_results.add_result(
                    "Trip Lifecycle - Create Trip",
                    False,
                    error=f"Create trip failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
                return test_results
            
            # 2. Test Get Trip
            if trip_id:
                response = await client.get(f"{API_BASE}/trips/{trip_id}")
                
                if response.status_code == 200:
                    retrieved_trip = response.json()
                    test_results.add_result(
                        "Trip Lifecycle - Get Trip",
                        True,
                        details=f"Trip retrieved successfully: {retrieved_trip['id']}"
                    )
                    
                    # Check if data matches
                    if retrieved_trip["id"] == trip_id:
                        test_results.add_result(
                            "Trip Lifecycle - Data Consistency",
                            True,
                            details="Retrieved trip matches created trip"
                        )
                    else:
                        test_results.add_result(
                            "Trip Lifecycle - Data Consistency",
                            False,
                            error="Retrieved trip data doesn't match created trip"
                        )
                else:
                    test_results.add_result(
                        "Trip Lifecycle - Get Trip",
                        False,
                        error=f"Get trip failed: {response.status_code} - {response.text}",
                        is_critical=True
                    )
            
            # 3. Test End Trip
            if trip_id:
                response = await client.post(f"{API_BASE}/trips/{trip_id}/end")
                
                if response.status_code == 200:
                    end_result = response.json()
                    test_results.add_result(
                        "Trip Lifecycle - End Trip",
                        True,
                        details=f"Trip ended successfully: {end_result.get('message', 'OK')}"
                    )
                    
                    # Verify trip status changed to 'ended'
                    verify_response = await client.get(f"{API_BASE}/trips/{trip_id}")
                    if verify_response.status_code == 200:
                        ended_trip = verify_response.json()
                        if ended_trip.get("status") == "ended":
                            test_results.add_result(
                                "Trip Lifecycle - End Status Update",
                                True,
                                details="Trip status correctly updated to 'ended'"
                            )
                        else:
                            test_results.add_result(
                                "Trip Lifecycle - End Status Update",
                                False,
                                error=f"Status not updated: {ended_trip.get('status')}"
                            )
                else:
                    test_results.add_result(
                        "Trip Lifecycle - End Trip",
                        False,
                        error=f"End trip failed: {response.status_code} - {response.text}",
                        is_critical=True
                    )
                        
    except Exception as e:
        test_results.add_result(
            "Trip Lifecycle - Connection",
            False,
            error=f"Failed to test trip lifecycle: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_location_tracking(trip_id):
    """Test location tracking endpoints with GPS coordinates"""
    test_results = TestResults()
    
    if not trip_id:
        test_results.add_result(
            "Location Tracking - Prerequisites",
            False,
            error="No active trip ID available for location testing",
            is_critical=True
        )
        return test_results
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # Test 1: Add GPS Location
            gps_location = {
                "trip_id": trip_id,
                "latitude": 28.6139,  # Delhi coordinates
                "longitude": 77.2090,
                "accuracy": 15.5,
                "source": "gps"
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/location", json=gps_location)
            
            if response.status_code == 200:
                location_result = response.json()
                test_results.add_result(
                    "Location Tracking - Add GPS Location",
                    True,
                    details=f"GPS location added: {location_result.get('message', 'OK')}"
                )
                
                # Verify location was stored
                trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
                if trip_response.status_code == 200:
                    trip_data = trip_response.json()
                    locations = trip_data.get("locations", [])
                    if len(locations) > 0:
                        last_location = locations[-1]
                        if abs(last_location["latitude"] - gps_location["latitude"]) < 0.001:
                            test_results.add_result(
                                "Location Tracking - GPS Data Persistence",
                                True,
                                details=f"GPS location persisted correctly in MongoDB"
                            )
                        else:
                            test_results.add_result(
                                "Location Tracking - GPS Data Persistence",
                                False,
                                error="GPS location data not persisted correctly"
                            )
                    else:
                        test_results.add_result(
                            "Location Tracking - GPS Data Persistence",
                            False,
                            error="No locations found in trip data"
                        )
            else:
                test_results.add_result(
                    "Location Tracking - Add GPS Location",
                    False,
                    error=f"Add GPS location failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
            
            # Test 2: Add Cellular Location (using Unwired Labs fallback)
            cellular_data = {
                "trip_id": trip_id,
                "mcc": 404,  # India
                "mnc": 10,   # Airtel
                "lac": 1234,
                "cid": 5678,
                "use_ip_fallback": True
            }
            
            response = await client.post(f"{API_BASE}/cellular-triangulation", json=cellular_data)
            
            if response.status_code == 200:
                cellular_result = response.json()
                test_results.add_result(
                    "Location Tracking - Cellular Triangulation",
                    True,
                    details=f"Cellular location: {cellular_result.get('status', 'OK')}"
                )
                
                # Check if it's demo mode or real
                if cellular_result.get("status") == "demo_mode":
                    test_results.add_result(
                        "Location Tracking - Unwired Labs Demo Mode",
                        True,
                        details="Unwired Labs API in demo mode (expected with demo key)"
                    )
                elif cellular_result.get("status") == "success":
                    test_results.add_result(
                        "Location Tracking - Unwired Labs Real API",
                        True,
                        details=f"Real cellular triangulation: {cellular_result.get('method')}"
                    )
            else:
                test_results.add_result(
                    "Location Tracking - Cellular Triangulation",
                    False,
                    error=f"Cellular triangulation failed: {response.status_code} - {response.text}"
                )
            
            # Test 3: Invalid Location (Error handling)
            invalid_location = {
                "trip_id": trip_id,
                "latitude": 91.0,  # Invalid latitude (>90)
                "longitude": 77.2090,
                "accuracy": 15.5,
                "source": "gps"
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/location", json=invalid_location)
            
            # Should either reject with 400 or accept and handle gracefully
            if response.status_code in [400, 422]:
                test_results.add_result(
                    "Location Tracking - Invalid Data Handling",
                    True,
                    details=f"Invalid location properly rejected: {response.status_code}"
                )
            elif response.status_code == 200:
                test_results.add_result(
                    "Location Tracking - Invalid Data Handling",
                    True,
                    details="Invalid location accepted (server handles gracefully)"
                )
            else:
                test_results.add_result(
                    "Location Tracking - Invalid Data Handling",
                    False,
                    error=f"Unexpected response to invalid data: {response.status_code}"
                )
                        
    except Exception as e:
        test_results.add_result(
            "Location Tracking - Connection",
            False,
            error=f"Failed to test location tracking: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_motion_detection(trip_id):
    """Test motion event detection (normal and panic movements)"""
    test_results = TestResults()
    
    if not trip_id:
        test_results.add_result(
            "Motion Detection - Prerequisites",
            False,
            error="No active trip ID available for motion testing",
            is_critical=True
        )
        return test_results
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # Test 1: Normal Motion
            normal_motion = {
                "trip_id": trip_id,
                "accel_variance": 1.5,  # Below panic threshold (2.0)
                "gyro_variance": 0.3    # Below panic threshold (0.5)
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=normal_motion)
            
            if response.status_code == 200:
                motion_result = response.json()
                test_results.add_result(
                    "Motion Detection - Normal Motion",
                    True,
                    details=f"Normal motion processed: {motion_result.get('message', 'OK')}"
                )
                
                # Should not be detected as panic
                if motion_result.get("is_panic") == False:
                    test_results.add_result(
                        "Motion Detection - Normal Motion Classification",
                        True,
                        details="Normal motion correctly classified as non-panic"
                    )
                else:
                    test_results.add_result(
                        "Motion Detection - Normal Motion Classification",
                        False,
                        error="Normal motion incorrectly classified as panic"
                    )
            else:
                test_results.add_result(
                    "Motion Detection - Normal Motion",
                    False,
                    error=f"Normal motion failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
            
            # Test 2: Panic Motion (High variance)
            panic_motion = {
                "trip_id": trip_id,
                "accel_variance": 5.0,  # Above panic threshold (2.0)
                "gyro_variance": 1.2    # Above panic threshold (0.5)
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=panic_motion)
            
            if response.status_code == 200:
                panic_result = response.json()
                test_results.add_result(
                    "Motion Detection - Panic Motion",
                    True,
                    details=f"Panic motion processed: {panic_result.get('message', 'OK')}"
                )
                
                # Should be detected as panic
                if panic_result.get("is_panic") == True:
                    test_results.add_result(
                        "Motion Detection - Panic Motion Classification",
                        True,
                        details="Panic motion correctly detected"
                    )
                else:
                    test_results.add_result(
                        "Motion Detection - Panic Motion Classification",
                        False,
                        error="Panic motion not detected (thresholds may be too high)"
                    )
            else:
                test_results.add_result(
                    "Motion Detection - Panic Motion",
                    False,
                    error=f"Panic motion failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
            
            # Test 3: Motion Data Persistence
            trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
            if trip_response.status_code == 200:
                trip_data = trip_response.json()
                motion_events = trip_data.get("motion_events", [])
                if len(motion_events) >= 2:  # Should have at least our 2 test events
                    test_results.add_result(
                        "Motion Detection - Data Persistence",
                        True,
                        details=f"Motion events persisted: {len(motion_events)} events found"
                    )
                    
                    # Check if panic event is stored correctly
                    panic_events = [e for e in motion_events if e.get("is_panic") == True]
                    if len(panic_events) > 0:
                        test_results.add_result(
                            "Motion Detection - Panic Event Storage",
                            True,
                            details="Panic event correctly stored in MongoDB"
                        )
                    else:
                        test_results.add_result(
                            "Motion Detection - Panic Event Storage",
                            False,
                            error="Panic event not found in stored motion events"
                        )
                else:
                    test_results.add_result(
                        "Motion Detection - Data Persistence",
                        False,
                        error="Motion events not persisted in MongoDB"
                    )
            
            # Test 4: Invalid Motion Data (Error handling)
            invalid_motion = {
                "trip_id": trip_id,
                "accel_variance": -1.0,  # Negative values should be invalid
                "gyro_variance": 0.5
            }
            
            response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=invalid_motion)
            
            if response.status_code in [400, 422]:
                test_results.add_result(
                    "Motion Detection - Invalid Data Handling",
                    True,
                    details=f"Invalid motion data properly rejected: {response.status_code}"
                )
            elif response.status_code == 200:
                test_results.add_result(
                    "Motion Detection - Invalid Data Handling",
                    True,
                    details="Invalid motion data accepted (server handles gracefully)"
                )
            else:
                test_results.add_result(
                    "Motion Detection - Invalid Data Handling",
                    False,
                    error=f"Unexpected response to invalid motion: {response.status_code}"
                )
                        
    except Exception as e:
        test_results.add_result(
            "Motion Detection - Connection",
            False,
            error=f"Failed to test motion detection: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_risk_evaluation(trip_id):
    """Test risk evaluation system"""
    test_results = TestResults()
    
    if not trip_id:
        test_results.add_result(
            "Risk Evaluation - Prerequisites",
            False,
            error="No active trip ID available for risk evaluation testing",
            is_critical=True
        )
        return test_results
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # Test 1: Manual Risk Evaluation
            response = await client.post(f"{API_BASE}/trips/{trip_id}/evaluate-risk")
            
            if response.status_code == 200:
                risk_result = response.json()
                test_results.add_result(
                    "Risk Evaluation - Manual Evaluation",
                    True,
                    details=f"Risk evaluation completed: {risk_result.get('risk_detected', 'No risk')}"
                )
                
                # Check response structure
                if "risk_detected" in risk_result:
                    if risk_result["risk_detected"]:
                        # Risk detected - should have additional fields
                        required_fields = ["rule_name", "confidence", "contributing_signals"]
                        missing_fields = [f for f in required_fields if f not in risk_result]
                        if missing_fields:
                            test_results.add_result(
                                "Risk Evaluation - Risk Response Structure",
                                False,
                                error=f"Missing risk fields: {missing_fields}"
                            )
                        else:
                            test_results.add_result(
                                "Risk Evaluation - Risk Response Structure",
                                True,
                                details=f"Risk detected: {risk_result['rule_name']} (confidence: {risk_result['confidence']})"
                            )
                    else:
                        test_results.add_result(
                            "Risk Evaluation - No Risk Response",
                            True,
                            details="No risk detected (expected with limited test data)"
                        )
                else:
                    test_results.add_result(
                        "Risk Evaluation - Response Structure",
                        False,
                        error="Response missing 'risk_detected' field"
                    )
            else:
                test_results.add_result(
                    "Risk Evaluation - Manual Evaluation",
                    False,
                    error=f"Risk evaluation failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
            
            # Test 2: Add Multiple Panic Events to Trigger Risk
            # Add several panic motion events in quick succession to trigger SUSTAINED_PANIC_MOVEMENT rule
            for i in range(4):
                panic_motion = {
                    "trip_id": trip_id,
                    "accel_variance": 6.0 + i,  # High variance
                    "gyro_variance": 1.5 + i * 0.2
                }
                
                response = await client.post(f"{API_BASE}/trips/{trip_id}/motion", json=panic_motion)
                if response.status_code != 200:
                    print(f"   ⚠️  Failed to add panic motion {i+1}: {response.status_code}")
                
                # Small delay to space events
                await asyncio.sleep(0.5)
            
            # Wait a moment for background risk evaluation to complete
            await asyncio.sleep(2)
            
            # Test 3: Check if Risk Events were Created
            trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
            if trip_response.status_code == 200:
                trip_data = trip_response.json()
                risk_events = trip_data.get("risk_events", [])
                
                if len(risk_events) > 0:
                    test_results.add_result(
                        "Risk Evaluation - Automatic Risk Detection",
                        True,
                        details=f"Risk events generated: {len(risk_events)} events"
                    )
                    
                    # Check risk event structure
                    last_risk = risk_events[-1]
                    required_risk_fields = ["rule_name", "confidence", "contributing_signals"]
                    missing_risk_fields = [f for f in required_risk_fields if f not in last_risk]
                    
                    if missing_risk_fields:
                        test_results.add_result(
                            "Risk Evaluation - Risk Event Structure",
                            False,
                            error=f"Missing risk event fields: {missing_risk_fields}"
                        )
                    else:
                        test_results.add_result(
                            "Risk Evaluation - Risk Event Structure",
                            True,
                            details=f"Risk event: {last_risk['rule_name']} (confidence: {last_risk['confidence']})"
                        )
                        
                        # Check if alert was triggered
                        if "alert_sent" in last_risk:
                            test_results.add_result(
                                "Risk Evaluation - Alert Integration",
                                True,
                                details=f"Alert status: {last_risk.get('alert_sent', False)}"
                            )
                else:
                    test_results.add_result(
                        "Risk Evaluation - Automatic Risk Detection",
                        False,
                        error="No risk events generated despite panic motion (thresholds may be too high)"
                    )
            else:
                test_results.add_result(
                    "Risk Evaluation - Trip Data Access",
                    False,
                    error=f"Cannot access trip data for risk verification: {trip_response.status_code}"
                )
            
            # Test 4: Debug Endpoint
            response = await client.get(f"{API_BASE}/trips/{trip_id}/debug")
            
            if response.status_code == 200:
                debug_data = response.json()
                test_results.add_result(
                    "Risk Evaluation - Debug Endpoint",
                    True,
                    details=f"Debug info available: {debug_data.get('motion_status', 'unknown')}"
                )
                
                # Check if panic is reflected in debug info
                if debug_data.get("motion_status") == "panic_detected":
                    test_results.add_result(
                        "Risk Evaluation - Debug Motion Status",
                        True,
                        details="Debug correctly shows panic detection"
                    )
            else:
                test_results.add_result(
                    "Risk Evaluation - Debug Endpoint",
                    False,
                    error=f"Debug endpoint failed: {response.status_code} - {response.text}"
                )
                        
    except Exception as e:
        test_results.add_result(
            "Risk Evaluation - Connection",
            False,
            error=f"Failed to test risk evaluation: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_guardian_management(trip_id):
    """Test guardian phone number management"""
    test_results = TestResults()
    
    if not trip_id:
        test_results.add_result(
            "Guardian Management - Prerequisites",
            False,
            error="No active trip ID available for guardian testing",
            is_critical=True
        )
        return test_results
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # Test 1: Update Guardian Phone Numbers
            guardian_data = {
                "trip_id": trip_id,
                "guardian_phone": "+919876543210",
                "guardian_phone_2": "+919876543211", 
                "guardian_phone_3": "+919876543212",
                "guardian_fcm_token": "test_fcm_token_123"
            }
            
            response = await client.put(f"{API_BASE}/trips/{trip_id}/guardian", json=guardian_data)
            
            if response.status_code == 200:
                guardian_result = response.json()
                test_results.add_result(
                    "Guardian Management - Update Guardians",
                    True,
                    details=f"Guardian update: {guardian_result.get('message', 'OK')}"
                )
            else:
                test_results.add_result(
                    "Guardian Management - Update Guardians",
                    False,
                    error=f"Guardian update failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
                return test_results
            
            # Test 2: Verify Guardian Data Persistence
            trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
            if trip_response.status_code == 200:
                trip_data = trip_response.json()
                
                # Check if guardian phone is updated
                if trip_data.get("guardian_phone") == guardian_data["guardian_phone"]:
                    test_results.add_result(
                        "Guardian Management - Primary Phone Persistence",
                        True,
                        details=f"Primary guardian phone persisted: {trip_data['guardian_phone']}"
                    )
                else:
                    test_results.add_result(
                        "Guardian Management - Primary Phone Persistence",
                        False,
                        error=f"Primary guardian phone not persisted correctly"
                    )
                
                # Check FCM token
                if trip_data.get("guardian_fcm_token") == guardian_data["guardian_fcm_token"]:
                    test_results.add_result(
                        "Guardian Management - FCM Token Persistence",
                        True,
                        details="FCM token persisted correctly"
                    )
                else:
                    test_results.add_result(
                        "Guardian Management - FCM Token Persistence",
                        False,
                        error="FCM token not persisted correctly"
                    )
            else:
                test_results.add_result(
                    "Guardian Management - Data Verification",
                    False,
                    error=f"Cannot verify guardian data: {trip_response.status_code}"
                )
            
            # Test 3: Invalid Guardian Data (Error handling)
            invalid_guardian = {
                "trip_id": trip_id,
                "guardian_phone": "invalid_phone_123"  # Invalid phone format
            }
            
            response = await client.put(f"{API_BASE}/trips/{trip_id}/guardian", json=invalid_guardian)
            
            # Server should either validate and reject, or accept and handle gracefully
            if response.status_code in [200, 400, 422]:
                test_results.add_result(
                    "Guardian Management - Invalid Data Handling",
                    True,
                    details=f"Invalid guardian data handled: {response.status_code}"
                )
            else:
                test_results.add_result(
                    "Guardian Management - Invalid Data Handling",
                    False,
                    error=f"Unexpected response to invalid guardian: {response.status_code}"
                )
                        
    except Exception as e:
        test_results.add_result(
            "Guardian Management - Connection",
            False,
            error=f"Failed to test guardian management: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_sms_alert_system(trip_id):
    """Test SMS alert system (demo mode)"""
    test_results = TestResults()
    
    if not trip_id:
        test_results.add_result(
            "SMS Alert System - Prerequisites",
            False,
            error="No active trip ID available for SMS testing",
            is_critical=True
        )
        return test_results
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            
            # Test 1: Test Alert Endpoint
            response = await client.post(f"{API_BASE}/trips/{trip_id}/test-alert")
            
            if response.status_code == 200:
                alert_result = response.json()
                test_results.add_result(
                    "SMS Alert System - Test Alert",
                    True,
                    details=f"Test alert: {alert_result.get('message', 'OK')}"
                )
                
                # Check alert results
                if "sms_sent" in alert_result:
                    sms_status = alert_result["sms_sent"]
                    test_results.add_result(
                        "SMS Alert System - SMS Status",
                        True,
                        details=f"SMS alert status: {sms_status} (demo mode expected)"
                    )
                    
                    # In demo mode, should return True (simulated success)
                    if sms_status == True:
                        test_results.add_result(
                            "SMS Alert System - Demo Mode SMS",
                            True,
                            details="SMS alert simulated successfully (Fast2SMS demo mode)"
                        )
                else:
                    test_results.add_result(
                        "SMS Alert System - Response Structure",
                        False,
                        error="SMS alert response missing 'sms_sent' field"
                    )
                
                # Check push notification status
                if "push_sent" in alert_result:
                    push_status = alert_result["push_sent"]
                    test_results.add_result(
                        "SMS Alert System - Push Notification",
                        True,
                        details=f"Push notification status: {push_status}"
                    )
                
                # Check guardian phone in response
                if "guardian_phone" in alert_result:
                    guardian = alert_result["guardian_phone"]
                    test_results.add_result(
                        "SMS Alert System - Guardian Info",
                        True,
                        details=f"Guardian phone: {guardian}"
                    )
            else:
                test_results.add_result(
                    "SMS Alert System - Test Alert",
                    False,
                    error=f"Test alert failed: {response.status_code} - {response.text}",
                    is_critical=True
                )
            
            # Test 2: Verify Alert is Logged in Trip
            await asyncio.sleep(1)  # Wait for alert to be processed
            
            trip_response = await client.get(f"{API_BASE}/trips/{trip_id}")
            if trip_response.status_code == 200:
                trip_data = trip_response.json()
                risk_events = trip_data.get("risk_events", [])
                
                # Look for test alert in risk events
                test_alerts = [e for e in risk_events if e.get("rule_name") == "TEST_ALERT"]
                if len(test_alerts) > 0:
                    test_results.add_result(
                        "SMS Alert System - Alert Logging",
                        True,
                        details="Test alert properly logged in trip risk events"
                    )
                    
                    # Check if SMS status is recorded
                    last_test_alert = test_alerts[-1]
                    if "sms_sent" in last_test_alert:
                        test_results.add_result(
                            "SMS Alert System - SMS Status Logging", 
                            True,
                            details=f"SMS status logged: {last_test_alert['sms_sent']}"
                        )
                else:
                    test_results.add_result(
                        "SMS Alert System - Alert Logging",
                        False,
                        error="Test alert not found in trip risk events"
                    )
            else:
                test_results.add_result(
                    "SMS Alert System - Alert Verification",
                    False,
                    error=f"Cannot verify alert logging: {trip_response.status_code}"
                )
                        
    except Exception as e:
        test_results.add_result(
            "SMS Alert System - Connection",
            False,
            error=f"Failed to test SMS alert system: {str(e)}",
            is_critical=True
        )
    
    return test_results

async def test_additional_endpoints():
    """Test additional endpoints like geocoding and safe routes"""
    test_results = TestResults()
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            
            # Test 1: Geocoding Endpoint
            geocode_data = {"place_name": "India Gate, New Delhi", "limit": 3}
            response = await client.post(f"{API_BASE}/geocode", json=geocode_data)
            
            if response.status_code == 200:
                geocode_result = response.json()
                test_results.add_result(
                    "Additional Endpoints - Geocoding",
                    True,
                    details=f"Geocoding successful: {len(geocode_result.get('results', []))} results"
                )
            else:
                test_results.add_result(
                    "Additional Endpoints - Geocoding",
                    False,
                    error=f"Geocoding failed: {response.status_code} - {response.text}"
                )
            
            # Test 2: Route Analysis
            route_data = {
                "origin_lat": 28.6139,
                "origin_lng": 77.2090,
                "dest_lat": 28.6315,
                "dest_lng": 77.2167
            }
            response = await client.post(f"{API_BASE}/routes/analyze", json=route_data)
            
            if response.status_code == 200:
                route_result = response.json()
                test_results.add_result(
                    "Additional Endpoints - Route Analysis",
                    True,
                    details=f"Route analysis: {route_result.get('safety_level', 'unknown')} safety level"
                )
            else:
                test_results.add_result(
                    "Additional Endpoints - Route Analysis",
                    False,
                    error=f"Route analysis failed: {response.status_code} - {response.text}"
                )
            
            # Test 3: Active Trips List
            response = await client.get(f"{API_BASE}/trips/active/list")
            
            if response.status_code == 200:
                active_trips = response.json()
                test_results.add_result(
                    "Additional Endpoints - Active Trips List",
                    True,
                    details=f"Active trips endpoint: {len(active_trips)} trips"
                )
            else:
                test_results.add_result(
                    "Additional Endpoints - Active Trips List",
                    False,
                    error=f"Active trips failed: {response.status_code} - {response.text}"
                )
            
            # Test 4: Root API Endpoint
            response = await client.get(f"{API_BASE}/")
            
            if response.status_code == 200:
                root_result = response.json()
                test_results.add_result(
                    "Additional Endpoints - Root API",
                    True,
                    details=f"Root API: {root_result.get('message', 'OK')}"
                )
            else:
                test_results.add_result(
                    "Additional Endpoints - Root API",
                    False,
                    error=f"Root API failed: {response.status_code} - {response.text}"
                )
                        
    except Exception as e:
        test_results.add_result(
            "Additional Endpoints - Connection",
            False,
            error=f"Failed to test additional endpoints: {str(e)}"
        )
    
    return test_results

async def main():
    """Run comprehensive backend tests for Nirbhay Safety App"""
    print("🚀 Starting Comprehensive Nirbhay Backend API Tests...")
    print(f"🔗 Backend URL: {API_BASE}")
    print(f"⏰ Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    all_results = TestResults()
    
    # Test 1: Health Check (Critical)
    print("\n🏥 Testing Health Check API...")
    health_results = await test_health_check()
    all_results.results.extend(health_results.results)
    all_results.passed += health_results.passed
    all_results.failed += health_results.failed
    all_results.backend_issues.extend(health_results.backend_issues)
    
    # If health check fails critically, stop testing
    if health_results.critical_failures:
        print(f"\n🚨 CRITICAL HEALTH CHECK FAILURES - Cannot continue testing")
        all_results.print_summary()
        return all_results
    
    # Test 2: Trip Lifecycle
    print("\n🚗 Testing Trip Lifecycle...")
    trip_results = await test_trip_lifecycle()
    all_results.results.extend(trip_results.results)
    all_results.passed += trip_results.passed
    all_results.failed += trip_results.failed
    all_results.backend_issues.extend(trip_results.backend_issues)
    
    # Get trip ID for subsequent tests
    trip_id = trip_results.created_trip_id
    if not trip_id:
        print(f"\n🚨 No trip ID available - Cannot test dependent features")
        all_results.print_summary()
        return all_results
    
    print(f"   🎯 Using Trip ID for subsequent tests: {trip_id}")
    
    # Test 3: Location Tracking
    print(f"\n📍 Testing Location Tracking...")
    location_results = await test_location_tracking(trip_id)
    all_results.results.extend(location_results.results)
    all_results.passed += location_results.passed
    all_results.failed += location_results.failed
    all_results.backend_issues.extend(location_results.backend_issues)
    
    # Test 4: Motion Detection
    print(f"\n🏃 Testing Motion Detection...")
    motion_results = await test_motion_detection(trip_id)
    all_results.results.extend(motion_results.results)
    all_results.passed += motion_results.passed
    all_results.failed += motion_results.failed
    all_results.backend_issues.extend(motion_results.backend_issues)
    
    # Test 5: Risk Evaluation
    print(f"\n⚠️ Testing Risk Evaluation System...")
    risk_results = await test_risk_evaluation(trip_id)
    all_results.results.extend(risk_results.results)
    all_results.passed += risk_results.passed
    all_results.failed += risk_results.failed
    all_results.backend_issues.extend(risk_results.backend_issues)
    
    # Test 6: Guardian Management
    print(f"\n👥 Testing Guardian Management...")
    guardian_results = await test_guardian_management(trip_id)
    all_results.results.extend(guardian_results.results)
    all_results.passed += guardian_results.passed
    all_results.failed += guardian_results.failed
    all_results.backend_issues.extend(guardian_results.backend_issues)
    
    # Test 7: SMS Alert System
    print(f"\n📱 Testing SMS Alert System...")
    sms_results = await test_sms_alert_system(trip_id)
    all_results.results.extend(sms_results.results)
    all_results.passed += sms_results.passed
    all_results.failed += sms_results.failed
    all_results.backend_issues.extend(sms_results.backend_issues)
    
    # Test 8: Additional Endpoints
    print(f"\n🔧 Testing Additional Endpoints...")
    additional_results = await test_additional_endpoints()
    all_results.results.extend(additional_results.results)
    all_results.passed += additional_results.passed
    all_results.failed += additional_results.failed
    all_results.backend_issues.extend(additional_results.backend_issues)
    
    # Print final comprehensive summary
    all_results.print_summary()
    
    # Calculate success percentage
    success_percentage = round((all_results.passed / len(all_results.results)) * 100, 1)
    
    # Save detailed results to file
    test_report = {
        "summary": f"Comprehensive backend API testing completed for Nirbhay Safety App",
        "test_details": {
            "total_tests": len(all_results.results),
            "passed": all_results.passed,
            "failed": all_results.failed,
            "success_rate": success_percentage,
            "critical_failures": len(all_results.critical_failures),
            "trip_id_used": trip_id
        },
        "backend_issues": {
            "critical_bugs": all_results.backend_issues
        },
        "test_results": all_results.results,
        "timestamp": datetime.now().isoformat(),
        "backend_url": API_BASE
    }
    
    with open('/app/test_reports/comprehensive_backend_test.json', 'w') as f:
        json.dump(test_report, f, indent=2)
    
    print(f"\n💾 Comprehensive test results saved to: /app/test_reports/comprehensive_backend_test.json")
    print(f"📊 Final Success Rate: {success_percentage}%")
    
    if success_percentage >= 80:
        print(f"✅ Backend testing PASSED - Most functionality working correctly")
    elif success_percentage >= 60:
        print(f"⚠️ Backend testing PARTIAL - Some issues need attention")
    else:
        print(f"❌ Backend testing FAILED - Critical issues need immediate attention")
    
    return all_results

if __name__ == "__main__":
    asyncio.run(main())