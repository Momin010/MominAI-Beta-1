// 🚀 MominAI API Keys Test Script
// Test all AI providers and payment systems

require('dotenv').config();

async function testAPIKeys() {
  console.log('🧪 Testing MominAI API Keys...\n');

  const results = {
    openrouter: false,
    openai: false,
    google: false,
    stripe: false
  };

  // Test OpenRouter
  try {
    console.log('🔄 Testing OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenRouter: Connected successfully');
      console.log(`   Available models: ${data.data?.length || 0}`);
      results.openrouter = true;
    } else {
      console.log('❌ OpenRouter: Failed to connect');
    }
  } catch (error) {
    console.log('❌ OpenRouter: Error -', error.message);
  }

  // Test OpenAI
  try {
    console.log('\n🔄 Testing OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI: Connected successfully');
      console.log(`   Available models: ${data.data?.length || 0}`);
      results.openai = true;
    } else {
      console.log('❌ OpenAI: Failed to connect');
    }
  } catch (error) {
    console.log('❌ OpenAI: Error -', error.message);
  }

  // Test Google AI
  try {
    console.log('\n🔄 Testing Google AI API...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Google AI: Connected successfully');
      console.log(`   Available models: ${data.models?.length || 0}`);
      results.google = true;
    } else {
      console.log('❌ Google AI: Failed to connect');
    }
  } catch (error) {
    console.log('❌ Google AI: Error -', error.message);
  }

  // Test Stripe
  try {
    console.log('\n🔄 Testing Stripe API...');
    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'name=Test Customer&email=test@example.com'
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Stripe: Connected successfully');
      console.log(`   Test customer created: ${data.id}`);
      results.stripe = true;

      // Clean up test customer
      if (data.id) {
        await fetch(`https://api.stripe.com/v1/customers/${data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
          }
        });
        console.log('   Test customer cleaned up');
      }
    } else {
      console.log('❌ Stripe: Failed to connect');
    }
  } catch (error) {
    console.log('❌ Stripe: Error -', error.message);
  }

  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('========================');
  Object.entries(results).forEach(([service, working]) => {
    const status = working ? '✅ WORKING' : '❌ FAILED';
    console.log(`${service.toUpperCase()}: ${status}`);
  });

  const workingCount = Object.values(results).filter(Boolean).length;
  const totalCount = Object.keys(results).length;

  console.log(`\n🎯 Overall: ${workingCount}/${totalCount} services working`);

  if (workingCount === totalCount) {
    console.log('🎉 ALL API KEYS ARE WORKING! Ready for deployment.');
  } else {
    console.log('⚠️  Some API keys need attention before deployment.');
  }

  return results;
}

// Run the test
testAPIKeys().catch(console.error);