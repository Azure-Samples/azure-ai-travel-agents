#!/usr/bin/env python3
"""Quick test script for simplified Magentic implementation."""

import asyncio
import logging
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.orchestrator.magentic_workflow import magentic_orchestrator

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_initialization():
    """Test that orchestrator can initialize."""
    logger.info("=" * 60)
    logger.info("Testing Magentic Orchestrator Initialization")
    logger.info("=" * 60)
    
    try:
        await magentic_orchestrator.initialize()
        logger.info("✓ Orchestrator initialized successfully")
        return True
    except Exception as e:
        logger.error(f"✗ Initialization failed: {e}", exc_info=True)
        return False


async def test_simple_request():
    """Test a simple request through the workflow."""
    logger.info("\n" + "=" * 60)
    logger.info("Testing Simple Request")
    logger.info("=" * 60)
    
    test_query = "What are some popular destinations for a beach vacation?"
    logger.info(f"Query: {test_query}")
    
    try:
        event_count = 0
        async for event in magentic_orchestrator.process_request_stream(test_query):
            event_count += 1
            event_type = event.get("type")
            agent = event.get("agent")
            event_name = event.get("event")
            
            logger.info(f"Event #{event_count}: type={event_type}, agent={agent}, event={event_name}")
            
            # Limit output for testing
            if event_count >= 10:
                logger.info("Received 10 events, stopping...")
                break
        
        logger.info(f"✓ Request completed with {event_count} events")
        return True
        
    except Exception as e:
        logger.error(f"✗ Request failed: {e}", exc_info=True)
        return False


async def main():
    """Run all tests."""
    logger.info("\n" + "=" * 60)
    logger.info("MAGENTIC ORCHESTRATOR TEST SUITE")
    logger.info("=" * 60 + "\n")
    
    # Test 1: Initialization
    init_ok = await test_initialization()
    
    if not init_ok:
        logger.error("\n❌ Initialization failed - skipping request test")
        return False
    
    # Test 2: Simple request
    request_ok = await test_simple_request()
    
    # Summary
    logger.info("\n" + "=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Initialization: {'✓ PASS' if init_ok else '✗ FAIL'}")
    logger.info(f"Simple Request: {'✓ PASS' if request_ok else '✗ FAIL'}")
    logger.info("=" * 60 + "\n")
    
    return init_ok and request_ok


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
