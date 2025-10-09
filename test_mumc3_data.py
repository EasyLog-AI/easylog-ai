#!/usr/bin/env python3
"""Test script to check mumc-3 data extraction."""
import asyncio
import sys
sys.path.insert(0, 'apps/api')

from src.agents.utils.patient_report_data import PatientReportDataAggregator

async def test_mumc3_data():
    """Test data extraction for mumc-3."""
    
    # Find mumc-3 thread
    from src.lib.prisma import prisma
    await prisma.connect()
    
    thread = await prisma.threads.find_first(where={'external_id': 'mumc-3'})
    
    if not thread:
        print("❌ Thread mumc-3 not found!")
        return
    
    print(f"✅ Found thread: {thread.id}")
    
    # Aggregate data
    aggregator = PatientReportDataAggregator(
        thread_id=thread.id,
        onesignal_id="mumc-3"
    )
    
    report_data = await aggregator.aggregate_report_data(period_days=30)
    
    # Print ZLM data
    print(f"\n🔍 ZLM Data:")
    zlm_data = report_data.get("zlm_scores", {})
    measurements = zlm_data.get("measurements", [])
    print(f"   Number of measurements: {len(measurements)}")
    for idx, measurement in enumerate(measurements, 1):
        print(f"   Measurement {idx}:")
        print(f"     Date: {measurement.get('date')}")
        print(f"     Scores: {len(measurement.get('scores', {}))} domains")
        print(f"     BMI: {measurement.get('bmi_value')}")
    
    # Print Goals data
    print(f"\n🎯 Goals Data:")
    goals = report_data.get("goals", [])
    print(f"   Number of goals: {len(goals)}")
    for idx, goal in enumerate(goals, 1):
        print(f"   Goal {idx}:")
        print(f"     Text: {goal.get('goal')}")
        print(f"     Date: {goal.get('date')}")
        print(f"     Status: {goal.get('status')}")
    
    # Print Medication data
    print(f"\n💊 Medication Data:")
    medication = report_data.get("medication", {})
    updates = medication.get("updates", [])
    print(f"   Number of updates: {len(updates)}")
    for idx, update in enumerate(updates, 1):
        print(f"   Update {idx}:")
        print(f"     Date: {update.get('date')}")
        meds = update.get('medications', [])
        print(f"     Medications: {len(meds)}")
        for med in meds:
            print(f"       - {med.get('name')} | {med.get('dosage')} | {med.get('timing')}")
    
    await prisma.disconnect()

if __name__ == "__main__":
    asyncio.run(test_mumc3_data())

