// 🚀 Simple API Keys Test for MominAI
// Quick test to verify your API keys work

async function testAPIKeys() {
  console.log('🧪 Testing MominAI API Keys...\n');

  const results = {
    openrouter: false,
    openai: false,
    google: false,
    stripe: false
  };

  // Test OpenRouter (simplified)
  try {
    console.log('🔄 Testing OpenRouter...');
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ OpenRouter: Working');
      results.openrouter = true;
    } else {
      console.log(`❌ OpenRouter: ${response.status} - Check your API key`);
    }
  } catch (error) {
    console.log('❌ OpenRouter: Network error');
  }

  // Test OpenAI
  try {
    console.log('\n🔄 Testing OpenAI...');
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ OpenAI: Working');
      results.openai = true;
    } else {
      console.log(`❌ OpenAI: ${response.status} - Check your API key`);
    }
  } catch (error) {
    console.log('❌ OpenAI: Network error');
  }

  // Test Google AI
  try {
    console.log('\n🔄 Testing Google AI...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`);

    if (response.ok) {
      console.log('✅ Google AI: Working');
      results.google = true;
    } else {
      console.log(`❌ Google AI: ${response.status} - Check your API key`);
    }
  } catch (error) {
    console.log('❌ Google AI: Network error');
  }

  // Test Stripe
  try {
    console.log('\n🔄 Testing Stripe...');
    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'name=Test Customer&email=test@example.com'
    });

    if (response.ok) {
      console.log('✅ Stripe: Working');
      results.stripe = true;

      // Clean up test customer
      const data = await response.json();
      if (data.id) {
        await fetch(`https://api.stripe.com/v1/customers/${data.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
          }
        });
      }
    } else {
      console.log(`❌ Stripe: ${response.status} - Check your API key`);
    }
  } catch (error) {
    console.log('❌ Stripe: Network error');
  }

  // Summary
  console.log('\n📊 RESULTS:');
  console.log('========================');
  const working = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([service, working]) => {
    console.log(`${service.toUpperCase()}: ${working ? '✅' : '❌'}`);
  });

  console.log(`\n🎯 ${working}/${total} services working`);

  if (working === total) {
    console.log('🎉 ALL API KEYS ARE WORKING!');
  } else {
    console.log('⚠️  Some API keys need attention.');
  }

  return results;
}

// Auto-run if this script is executed directly
if (typeof window === 'undefined') {
  testAPIKeys().catch(console.error);
}

export { testAPIKeys };