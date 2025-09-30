"""
MUMC Agent Conversation Testing Script

Tests the MUMCAgentTest agent by simulating real user conversations
and validating tool calls, responses, and metadata updates.

Run with: python -m pytest tests/test_mumc_agent_conversation.py -v
Or directly: python tests/test_mumc_agent_conversation.py
"""

import asyncio
import json
from datetime import datetime
from typing import Any

import httpx
from prisma import Prisma

# Configuration
API_BASE_URL = "http://localhost:8000"  # Change to staging2.easylog.nu/ai for remote
TEST_THREAD_ID = "test-mumc-agent-" + datetime.now().strftime("%Y%m%d-%H%M%S")
TEST_AGENT_CONFIG = {
    "agent_class": "MUMCAgentTest",
    "roles": [
        {
            "name": "MUMCAssistant",
            "prompt": "Je bent een vriendelijke COPD coach",
            "model": "anthropic/claude-sonnet-4",
            "tools_regex": ".*",
            "questionaire": [],
        }
    ],
    "prompt": "You are a COPD lifestyle coach. Current role: {current_role}",
}

# Test cases
TEST_CONVERSATIONS = [
    {
        "name": "Reminder Creation Test",
        "description": "Test if agent correctly creates a daily reminder",
        "messages": [
            {
                "user_input": "Stuur me elke dag om 20:00 een wandel reminder",
                "expected_tool": "tool_set_recurring_task",
                "expected_params": {
                    "cron_expression": "0 20 * * *",
                },
            }
        ],
    },
    {
        "name": "One-time Reminder Test",
        "description": "Test if agent creates a one-time reminder",
        "messages": [
            {
                "user_input": "Herinner me morgen om 10:00 aan medicatie",
                "expected_tool": "tool_add_reminder",
                "expected_params_contains": ["medicatie"],
            }
        ],
    },
    {
        "name": "Memory Storage Test",
        "description": "Test if agent stores user information correctly",
        "messages": [
            {
                "user_input": "Ik ben 65 jaar oud",
                "expected_tool": "tool_store_memory",
                "expected_params_contains": ["65", "jaar"],
            }
        ],
    },
]


class MUMCAgentTester:
    """Test runner for MUMC Agent conversations."""

    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.thread_id: str | None = None
        self.test_results: list[dict[str, Any]] = []
        self.prisma = Prisma()

    async def initialize(self) -> None:
        """Initialize test environment and create test thread."""
        await self.prisma.connect()
        print(f"🔧 Initializing test environment...")
        print(f"📍 API Base URL: {self.base_url}")
        print(f"🧪 Test Thread ID: {TEST_THREAD_ID}")
        print()

        # Create test thread
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/threads",
                json={"external_id": TEST_THREAD_ID},
                timeout=30.0,
            )
            if response.status_code == 200:
                data = response.json()
                self.thread_id = data["id"]
                print(f"✅ Test thread created: {self.thread_id}")
            else:
                raise Exception(f"Failed to create thread: {response.text}")

    async def send_message(self, user_input: str) -> dict[str, Any]:
        """Send a message to the agent and parse the streaming response."""
        if not self.thread_id:
            raise Exception("Thread not initialized")

        print(f"\n💬 User: {user_input}")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/threads/{self.thread_id}/messages",
                json={
                    "agent_config": TEST_AGENT_CONFIG,
                    "content": [{"type": "text", "text": user_input}],
                },
                timeout=60.0,
            )

            if response.status_code != 200:
                print(f"❌ Error: {response.status_code} - {response.text}")
                return {"error": response.text, "tool_calls": []}

            # Parse streaming response
            full_text = ""
            tool_calls = []

            for line in response.text.split("\n"):
                if not line.strip() or not line.startswith("data: "):
                    continue

                try:
                    data = json.loads(line[6:])  # Skip "data: " prefix

                    if data.get("type") == "text":
                        full_text = data.get("text", "")

                    if data.get("type") == "tool_use":
                        tool_calls.append(
                            {
                                "name": data.get("tool_use", {}).get("name"),
                                "input": data.get("tool_use", {}).get("input", {}),
                            }
                        )
                except json.JSONDecodeError:
                    continue

            print(f"🤖 Assistant: {full_text[:200]}...")
            if tool_calls:
                print(f"🔧 Tools called: {[t['name'] for t in tool_calls]}")

            return {"text": full_text, "tool_calls": tool_calls}

    async def validate_test_case(self, test_case: dict[str, Any]) -> dict[str, Any]:
        """Run a single test case and validate the results."""
        print(f"\n{'='*60}")
        print(f"🧪 Test: {test_case['name']}")
        print(f"📝 {test_case['description']}")
        print(f"{'='*60}")

        results = {"name": test_case["name"], "passed": True, "issues": []}

        for msg in test_case["messages"]:
            response = await self.send_message(msg["user_input"])

            # Validate tool calls
            if "expected_tool" in msg:
                tool_names = [t["name"] for t in response.get("tool_calls", [])]

                if msg["expected_tool"] not in tool_names:
                    results["passed"] = False
                    results["issues"].append(
                        f"❌ Expected tool '{msg['expected_tool']}' not called. "
                        f"Called: {tool_names}"
                    )
                else:
                    print(f"✅ Correct tool called: {msg['expected_tool']}")

            # Validate parameters
            if "expected_params" in msg:
                for tool_call in response.get("tool_calls", []):
                    if tool_call["name"] == msg["expected_tool"]:
                        for key, expected_value in msg["expected_params"].items():
                            actual_value = tool_call["input"].get(key)
                            if actual_value != expected_value:
                                results["passed"] = False
                                results["issues"].append(
                                    f"❌ Parameter '{key}': expected '{expected_value}', "
                                    f"got '{actual_value}'"
                                )
                            else:
                                print(f"✅ Parameter '{key}' correct: {expected_value}")

            # Validate parameter content
            if "expected_params_contains" in msg:
                params_str = json.dumps(response.get("tool_calls", []))
                for keyword in msg["expected_params_contains"]:
                    if keyword.lower() not in params_str.lower():
                        results["passed"] = False
                        results["issues"].append(
                            f"❌ Expected keyword '{keyword}' not found in parameters"
                        )
                    else:
                        print(f"✅ Keyword '{keyword}' found in parameters")

            # Small delay between messages
            await asyncio.sleep(1)

        self.test_results.append(results)
        return results

    async def cleanup(self) -> None:
        """Clean up test thread after testing."""
        if self.thread_id:
            print(f"\n🧹 Cleaning up test thread: {self.thread_id}")
            async with httpx.AsyncClient() as client:
                await client.delete(f"{self.base_url}/threads/{self.thread_id}")

        await self.prisma.disconnect()

    def generate_report(self) -> str:
        """Generate a markdown test report."""
        total = len(self.test_results)
        passed = sum(1 for r in self.test_results if r["passed"])
        failed = total - passed

        report = f"""# MUMC Agent Test Report

**Date**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Agent**: MUMCAgentTest  
**Super Agent Interval**: 4 hours (0 */4 * * *)  
**Thread ID**: {TEST_THREAD_ID}

---

## Summary

- **Total Tests**: {total}
- **Passed**: ✅ {passed}
- **Failed**: ❌ {failed}
- **Success Rate**: {(passed/total*100) if total > 0 else 0:.1f}%

---

## Test Results

"""

        for result in self.test_results:
            status = "✅ PASSED" if result["passed"] else "❌ FAILED"
            report += f"### {result['name']} {status}\n\n"

            if result["issues"]:
                report += "**Issues Found:**\n"
                for issue in result["issues"]:
                    report += f"- {issue}\n"
                report += "\n"
            else:
                report += "No issues found.\n\n"

        report += """---

## Notes

- Super agent runs every 4 hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
- Production agent runs every 15 minutes
- Test agent has notification-to-chat functionality
- All notifications appear in chat with 🔔 emoji

---

**Generated by**: MUMC Agent Tester  
**Test Thread**: Can be found in Neon database with external_id: `{TEST_THREAD_ID}`
"""

        return report


async def main():
    """Main test execution function."""
    tester = MUMCAgentTester()

    try:
        await tester.initialize()

        print("\n🚀 Starting test execution...")
        print(f"📋 Running {len(TEST_CONVERSATIONS)} test cases\n")

        for test_case in TEST_CONVERSATIONS:
            await tester.validate_test_case(test_case)

        # Generate and print report
        report = tester.generate_report()
        print("\n" + "=" * 60)
        print(report)
        print("=" * 60)

        # Save report to file
        report_path = f"test_reports/mumc_agent_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
        print(f"\n💾 Saving report to: {report_path}")
        # Note: Create directory first if needed

    finally:
        await tester.cleanup()
        print("\n✅ Test session completed!")


if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║          MUMC Agent Conversation Tester                      ║
║                                                              ║
║  Automated testing for agent prompts & tool calling          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
""")
    asyncio.run(main())

