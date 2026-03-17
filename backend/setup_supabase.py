"""
Supabase Setup Script for Nirbhay
- Creates/recreates the invites table
- Inserts 60 invite codes: NIRB-0001 to NIRB-0060
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SECRET_KEY")
supabase = create_client(url, key)

print("=" * 50)
print("Nirbhay Supabase Setup")
print("=" * 50)

# Step 1: Check current invites table
print("\n[1/3] Checking existing invites table...")
try:
    result = supabase.table("invites").select("*").execute()
    print(f"  Found {len(result.data)} existing invite codes")
    if result.data:
        print(f"  Sample: {result.data[0]}")
except Exception as e:
    print(f"  Table might not exist yet: {e}")

# Step 2: Delete all existing invites and insert fresh 60 codes
print("\n[2/3] Setting up 60 invite codes (NIRB-0001 to NIRB-0060)...")
try:
    # Delete existing invites
    supabase.table("invites").delete().neq("invite_code", "IMPOSSIBLE_VALUE").execute()
    print("  Cleared existing invites")
except Exception as e:
    print(f"  Note: {e}")

# Insert 60 fresh codes in batches
codes = []
for i in range(1, 61):
    codes.append({
        "invite_code": f"NIRB-{i:04d}",
        "used": False
    })

# Insert in batches of 20
for batch_start in range(0, len(codes), 20):
    batch = codes[batch_start:batch_start + 20]
    try:
        supabase.table("invites").insert(batch).execute()
        print(f"  Inserted NIRB-{batch_start + 1:04d} to NIRB-{batch_start + len(batch):04d}")
    except Exception as e:
        print(f"  Error inserting batch: {e}")

# Step 3: Verify
print("\n[3/3] Verifying...")
result = supabase.table("invites").select("*").order("invite_code").execute()
print(f"  Total invite codes: {len(result.data)}")
if result.data:
    print(f"  First: {result.data[0]['invite_code']}")
    print(f"  Last:  {result.data[-1]['invite_code']}")
    used_count = sum(1 for r in result.data if r.get("used"))
    print(f"  Used: {used_count}, Available: {len(result.data) - used_count}")

# Also check trips table
print("\n--- Checking trips table ---")
try:
    result = supabase.table("trips").select("id,status,start_time").limit(5).execute()
    print(f"  Trips table exists with {len(result.data)} records")
except Exception as e:
    print(f"  Trips table issue: {e}")

print("\n" + "=" * 50)
print("Setup complete!")
print("=" * 50)
