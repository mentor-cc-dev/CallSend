import axios from 'axios';

const BASE_URL = 'http://localhost:4000';
const ORG_ID = '6a5b95fe-7f33-49d4-8ce0-1529f22d6262';

async function testCrmFeatures() {
  console.log('===========================================================');
  console.log('🎯 CALLSEND FULL CONVERSATIONAL CRM VERIFICATION TEST');
  console.log('===========================================================');

  try {
    // 0. Fetch Active Default Org
    const defaultOrgRes = await axios.get(`${BASE_URL}/api/v1/organizations/active/default`);
    const ORG_ID = defaultOrgRes.data.organization.id;
    console.log(`\n0. Connected to Active Organization: ${defaultOrgRes.data.organization.name} (${ORG_ID})`);

    // 1. Pipeline Stages & Kanban Data
    console.log('\n1. Fetching CRM Sales Pipeline & Kanban Stages...');
    const pipelineRes = await axios.get(`${BASE_URL}/api/v1/crm/deals/pipeline/${ORG_ID}`);
    console.log(`✅ Loaded ${pipelineRes.data.stages.length} pipeline stages`);
    console.log(`   Total Deals: ${pipelineRes.data.summary.totalDeals}`);
    console.log(`   Pipeline Value: ${pipelineRes.data.summary.totalPipelineValue} UZS`);
    
    const firstStage = pipelineRes.data.stages[0];
    const secondStage = pipelineRes.data.stages[1];

    // 2. Fetch Customer 360 Profile
    console.log('\n2. Fetching Customer 360° Unified Dossier...');
    const deal = firstStage.deals[0] || pipelineRes.data.stages[2].deals[0];
    const customerId = deal.customer.id;
    
    const c360Res = await axios.get(`${BASE_URL}/api/v1/crm/customers/${customerId}/timeline`);
    console.log(`✅ Customer 360: ${c360Res.data.customer.fullName} (${c360Res.data.customer.phoneNumber})`);
    console.log(`   LTV: ${c360Res.data.customer.totalSpent} UZS, Tags: [${c360Res.data.customer.tags.join(', ')}]`);
    console.log(`   Timeline items: ${c360Res.data.timeline.length} events logged`);

    // 3. Add Operator Note (Internal memory)
    console.log('\n3. Adding Operator Internal Note...');
    const noteRes = await axios.post(`${BASE_URL}/api/v1/crm/customers/${customerId}/notes`, {
      content: 'Mijoz bilan telefonda gaplashildi: chegirma taklif qilindi, ertaga javob beradi.',
    });
    console.log(`✅ Note saved: "${noteRes.data.content.slice(0, 40)}..."`);

    // 4. Create Callback Task
    console.log('\n4. Creating Callback / Task Reminder...');
    const taskRes = await axios.post(`${BASE_URL}/api/v1/crm/tasks`, {
      organizationId: ORG_ID,
      customerId,
      title: 'Soat 16:00 da qayta qo‘ng‘iroq qilish va buyurtmani yopish',
      dueDate: new Date(Date.now() + 86400000).toISOString(),
      priority: 'HIGH',
    });
    console.log(`✅ Task created: ID ${taskRes.data.id} (Status: ${taskRes.data.status})`);

    // 5. Complete Task
    console.log('\n5. Completing Task...');
    const taskUpdateRes = await axios.patch(`${BASE_URL}/api/v1/crm/tasks/${taskRes.data.id}/status`, {
      status: 'COMPLETED',
    });
    console.log(`✅ Task status updated: ${taskUpdateRes.data.status}`);

    // 6. Move Deal to next stage (Stage Transition)
    console.log('\n6. Transitioning Deal along the Pipeline...');
    const moveRes = await axios.patch(`${BASE_URL}/api/v1/crm/deals/${deal.id}/stage`, {
      stageId: secondStage.id,
    });
    console.log(`✅ Deal "${moveRes.data.title}" successfully moved to "${moveRes.data.stage.name}"!`);

    console.log('\n===========================================================');
    console.log('🎉 ALL FULL CRM SUITE VERIFICATION TESTS PASSED 100%!');
    console.log('===========================================================');
  } catch (error: any) {
    console.error('❌ CRM Test failed:', error?.response?.data || error.message);
    process.exit(1);
  }
}

testCrmFeatures();
