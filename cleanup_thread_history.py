#!/usr/bin/env python3
"""
Cleanup script for thread history.
Keeps last N messages, removes older ones.

Usage:
  python cleanup_thread_history.py <external_id> [keep_last_n]
  
Examples:
  python cleanup_thread_history.py mumc-3 50
  python cleanup_thread_history.py heuvel-1 30
  python cleanup_thread_history.py --list  # List all threads
"""
import asyncio
import sys
from datetime import datetime

# Add src to path
sys.path.insert(0, '/app')

from src.lib.prisma import prisma


async def list_threads():
    """List all threads with their message counts."""
    await prisma.connect()
    
    try:
        # Get all threads with message counts
        threads = await prisma.threads.find_many(
            order={'created_at': 'desc'},
            take=100
        )
        
        print(f"\n📋 Available threads ({len(threads)} total):\n")
        print(f"{'External ID':<30} {'Messages':<12} {'Created At'}")
        print("-" * 70)
        
        for thread in threads:
            msg_count = await prisma.messages.count(where={'thread_id': thread.id})
            created = thread.created_at.strftime('%Y-%m-%d %H:%M')
            print(f"{thread.external_id:<30} {msg_count:<12} {created}")
        
    finally:
        await prisma.disconnect()


async def cleanup_thread_history(external_id: str, keep_last_n: int = 50, auto_confirm: bool = False):
    """
    Clean up thread history, keeping only the last N messages.
    
    Args:
        external_id: Thread external ID (e.g., 'mumc-3', 'heuvel-1', etc.)
        keep_last_n: Number of recent messages to keep (default: 50)
        auto_confirm: Skip confirmation prompts (default: False)
    """
    await prisma.connect()
    
    try:
        # Step 1: Find thread
        print(f"\n🔍 Looking for thread: {external_id}")
        thread = await prisma.threads.find_first(where={'external_id': external_id})
        
        if not thread:
            print(f"❌ Thread '{external_id}' not found!")
            return
        
        print(f"✅ Found thread: {thread.id}")
        
        # Step 2: Count total messages
        total_messages = await prisma.messages.count(where={'thread_id': thread.id})
        print(f"📊 Total messages: {total_messages}")
        
        if total_messages <= keep_last_n:
            print(f"✅ Thread has {total_messages} messages, no cleanup needed (keeping {keep_last_n})")
            return
        
        messages_to_delete = total_messages - keep_last_n
        print(f"🗑️  Will delete {messages_to_delete} old messages (keeping last {keep_last_n})")
        
        # Step 3: Get messages to delete (oldest ones)
        all_messages = await prisma.messages.find_many(
            where={'thread_id': thread.id},
            order={'created_at': 'asc'},
            take=messages_to_delete
        )
        
        print(f"\n📋 Messages to delete:")
        for i, msg in enumerate(all_messages[:5], 1):
            print(f"  {i}. {msg.role} - {msg.created_at}")
        if len(all_messages) > 5:
            print(f"  ... and {len(all_messages) - 5} more")
        
        # Step 4: Check first remaining message for orphaned tool_result
        remaining_messages = await prisma.messages.find_many(
            where={'thread_id': thread.id},
            order={'created_at': 'asc'},
            skip=messages_to_delete,
            take=3,
            include={'contents': True}
        )
        
        print(f"\n🔍 First messages after cleanup:")
        for msg in remaining_messages[:3]:
            content_types = [c.type for c in msg.contents] if msg.contents else []
            print(f"  - {msg.role}: {content_types}")
        
        # Step 5: Delete old messages
        print(f"\n⚠️  Ready to delete {messages_to_delete} messages...")
        
        if not auto_confirm:
            confirm = input("Continue? (yes/no): ")
            if confirm.lower() != 'yes':
                print("❌ Cancelled by user")
                return
        else:
            print("✅ Auto-confirm enabled, proceeding...")
        
        # Delete messages (contents will cascade)
        deleted_count = await prisma.messages.delete_many(
            where={
                'id': {'in': [msg.id for msg in all_messages]}
            }
        )
        
        print(f"✅ Deleted {deleted_count} messages")
        
        # Step 6: Check if first message is orphaned tool_result
        first_msg = await prisma.messages.find_first(
            where={'thread_id': thread.id},
            order={'created_at': 'asc'},
            include={'contents': True}
        )
        
        if first_msg and first_msg.role == 'tool':
            print(f"\n⚠️  WARNING: First message is orphaned tool_result!")
            print(f"   Message ID: {first_msg.id}")
            print(f"   Role: {first_msg.role}")
            print(f"   Contents: {[c.type for c in first_msg.contents] if first_msg.contents else []}")
            
            if not auto_confirm:
                confirm_fix = input("Delete this orphaned message? (yes/no): ")
                if confirm_fix.lower() == 'yes':
                    await prisma.messages.delete(where={'id': first_msg.id})
                    print(f"✅ Deleted orphaned tool_result message")
            else:
                await prisma.messages.delete(where={'id': first_msg.id})
                print(f"✅ Auto-deleted orphaned tool_result message")
        
        # Final count
        final_count = await prisma.messages.count(where={'thread_id': thread.id})
        print(f"\n✅ Cleanup complete! Final message count: {final_count}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await prisma.disconnect()


def print_usage():
    """Print usage instructions."""
    print("""
Usage:
  python cleanup_thread_history.py <external_id> [keep_last_n] [--auto-confirm]
  python cleanup_thread_history.py --list
  
Arguments:
  external_id       Thread external ID (e.g., 'mumc-3', 'heuvel-1')
  keep_last_n       Number of recent messages to keep (default: 50)
  --auto-confirm    Skip confirmation prompts (optional)
  --list            List all available threads
  
Examples:
  python cleanup_thread_history.py mumc-3 50
  python cleanup_thread_history.py heuvel-1 30 --auto-confirm
  python cleanup_thread_history.py --list
    """)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("❌ Error: Missing arguments")
        print_usage()
        sys.exit(1)
    
    # Check for --list flag
    if '--list' in sys.argv or sys.argv[1] == '--list':
        asyncio.run(list_threads())
        sys.exit(0)
    
    # Parse arguments
    external_id = sys.argv[1]
    keep_last_n = 50  # default
    auto_confirm = '--auto-confirm' in sys.argv
    
    # Check if keep_last_n is provided
    if len(sys.argv) >= 3 and sys.argv[2].isdigit():
        keep_last_n = int(sys.argv[2])
    
    print(f"\n🧹 Thread History Cleanup")
    print(f"   Thread: {external_id}")
    print(f"   Keep last: {keep_last_n} messages")
    print(f"   Auto-confirm: {auto_confirm}")
    
    asyncio.run(cleanup_thread_history(external_id, keep_last_n, auto_confirm))

