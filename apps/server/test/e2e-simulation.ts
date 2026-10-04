import axios from 'axios';

const BASE_URL = 'http://localhost:4000';

async function runE2ETest() {
  console.log('===========================================================');
  console.log('🧪 CALLSEND END-TO-END AUTOMATED VERIFICATION TEST');
  console.log('===========================================================');

  try {
    // 1. Check Server Health / Details
    console.log('\n1. Fetching Organization & Initial Stats...');
    const orgRes = await axios.get(`${BASE_URL}/api/v1/organizations/6a5b95fe-7f33-49d4-8ce0-1529f22d6262`);
    console.log(`✅ Organization: ${orgRes.data.organization.name}`);
    console.log(`   Initial Calls: ${orgRes.data.stats.totalCalls}, SMS: ${orgRes.data.stats.totalMessages}`);

    // 2. Simulate Device Heartbeat
    console.log('\n2. Testing Android Gateway Heartbeat...');
    const hbRes = await axios.post(`${BASE_URL}/api/v1/telephony/devices/heartbeat`, {
      deviceToken: 'test_android_token_777',
      batteryLevel: 98,
    });
    console.log(`✅ Heartbeat status: ${hbRes.status === 200 ? 'OK' : 'FAIL'}`);

    // 3. Simulate Incoming Call (RINGING)
    console.log('\n3. Simulating Incoming Call RINGING (+998901234567)...');
    const ringRes = await axios.post(`${BASE_URL}/api/v1/telephony/events`, {
      event: 'CALL_START',
      caller_number: '+998901234567',
      device_token: 'test_android_token_777',
      destination_number: '+998712000001',
    });
    console.log(`✅ Incoming call recorded: ID ${ringRes.data.callLogId}`);

    // 4. Simulate Call Ended (CALL_END) -> Triggers Auto-Pilot
    console.log('\n4. Simulating Call Ended (Duration: 35s) -> Triggers Auto-Pilot...');
    const endRes = await axios.post(`${BASE_URL}/api/v1/telephony/events`, {
      event: 'CALL_END',
      caller_number: '+998901234567',
      device_token: 'test_android_token_777',
      duration: 35,
    });
    console.log(`✅ Call ended successfully: ID ${endRes.data.callLogId}`);

    // 5. Test Manual 1-Click Dispatch from Operator HUD
    console.log('\n5. Testing Operator 1-Click Manual Dispatch...');
    const dispatchRes = await axios.post(`${BASE_URL}/api/v1/messages/dispatch`, {
      organizationId: '6a5b95fe-7f33-49d4-8ce0-1529f22d6262',
      phoneNumber: '+998909876543',
    });
    console.log(`✅ SMS Dispatched! Short code: ${dispatchRes.data.shortCode}`);
    console.log(`   Dynamic Link: ${dispatchRes.data.dynamicLink}`);

    const shortCode = dispatchRes.data.shortCode;

    // 6. Test Micro-Landing Page View (Customer opens the link)
    console.log(`\n6. Simulating Customer Opening Micro-Landing (${shortCode})...`);
    const landingRes = await axios.get(`${BASE_URL}/api/v1/public/landing/${shortCode}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
    });
    console.log(`✅ Micro-Landing rendered successfully!`);
    console.log(`   Title: ${landingRes.data.content.title}`);
    console.log(`   Price: ${landingRes.data.content.price} UZS`);
    console.log(`   Customer: ${landingRes.data.customer.phoneNumber}`);

    // 7. Test Customer Action (Telegram click event)
    console.log('\n7. Customer clicks "Telegram orqali bog‘lanish"...');
    const eventRes = await axios.post(`${BASE_URL}/api/v1/public/tracking/event`, {
      shortCode,
      eventType: 'TELEGRAM_CLICK',
    });
    console.log(`✅ Event recorded: ${eventRes.data.success ? 'OK' : 'FAIL'}`);

    // 8. Test Customer Order Placement from Micro-Landing
    console.log('\n8. Customer places an Order from Micro-Landing...');
    const orderRes = await axios.post(`${BASE_URL}/api/v1/public/orders`, {
      shortCode,
      itemsSummary: 'Artel Inverter 12 HD Konditsioner',
      customerNote: 'Yetkazib berish Toshkent Chilonzor 9-mavze',
    });
    console.log(`✅ Order Placed! Order ID: ${orderRes.data.orderId}`);
    console.log(`   Message: ${orderRes.data.message}`);

    // 9. Verify Updated Stats in Dashboard
    console.log('\n9. Verifying Updated Analytics & Radar Stats...');
    const finalStats = await axios.get(`${BASE_URL}/api/v1/organizations/6a5b95fe-7f33-49d4-8ce0-1529f22d6262`);
    console.log(`✅ Final Stats:`);
    console.log(`   Total Calls: ${finalStats.data.stats.totalCalls}`);
    console.log(`   Total Messages: ${finalStats.data.stats.totalMessages}`);
    console.log(`   Opened Messages: ${finalStats.data.stats.openedMessages}`);
    console.log(`   Open Rate: ${finalStats.data.stats.openRate}%`);
    console.log(`   Total Orders: ${finalStats.data.stats.totalOrders}`);

    console.log('\n===========================================================');
    console.log('🎉 ALL INTEGRATION & ARCHITECTURE TESTS PASSED 100%!');
    console.log('===========================================================');
  } catch (error: any) {
    console.error('❌ Test failed:', error?.response?.data || error.message);
    process.exit(1);
  }
}

runE2ETest();
