/**
 * SIMPLE TEST RUNNER
 * 
 * Add this to your settings screen or create a test button
 * to run the comprehensive validation
 */

export const triggerComprehensiveTests = async () => {
  console.log('\n🚀 Starting Comprehensive Notification Tests...\n');
  
  try {
    const { runComprehensiveNotificationValidation } = await import('@/utils/notificationComprehensiveValidator');
    await runComprehensiveNotificationValidation();
  } catch (error) {
    console.error('Failed to run tests:', error);
  }
};

// For quick access - can be called from anywhere
export const quickTestCheck = async () => {
  const { runSmokeTest, runProductionTestSuite } = await import('@/utils/notificationProductionTests');
  
  console.log('\n🔥 Running quick test...\n');
  const smokeOk = await runSmokeTest();
  
  if (smokeOk) {
    console.log('\n✅ Smoke test passed. Running full suite...\n');
    await runProductionTestSuite();
  } else {
    console.log('\n❌ Smoke test failed!');
  }
};
