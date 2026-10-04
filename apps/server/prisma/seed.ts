import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding CallSend database with Full CRM data...');

  // Clean old data in order
  await prisma.crmTask.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.customerEvent.deleteMany();
  await prisma.order.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.callLog.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.device.deleteMany();
  await prisma.template.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'Artel Comfort Pro',
      slug: 'artel-comfort',
      mode: 'COMPANY',
      autoPilotEnabled: true,
      autoPilotDelaySec: 2,
      smsBalance: 150,
      settings: JSON.stringify({
        primaryColor: '#2563eb',
        logoUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=150',
      }),
    },
  });

  // 2. Create Branches
  const mainBranch = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: 'Chilonzor Markaziy Filial',
      address: 'Toshkent sh., Chilonzor tumani, Bunyodkor shoh ko‘chasi, 42-uy',
      latitude: 41.2858,
      longitude: 69.2035,
      phoneNumbers: '+998712000001, +998901234567',
      isMain: true,
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      organizationId: org.id,
      name: 'Yunusobod Filial',
      address: 'Toshkent sh., Yunusobod 4-mavze, Amir Temur ko‘chasi, 15',
      latitude: 41.3654,
      longitude: 69.2882,
      phoneNumbers: '+998712000002',
      isMain: false,
    },
  });

  // 3. Create Users (Operators & Managers)
  const operatorUser = await prisma.user.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      phone: '+998901112233',
      fullName: 'Alisher Qodirov (Operator)',
      role: 'BRANCH_OPERATOR',
    },
  });

  // 4. Create Paired Android Device
  await prisma.device.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      deviceToken: 'test_android_token_777',
      modelName: 'Samsung Galaxy S23 (Test Gateway)',
      batteryLevel: 94,
    },
  });

  // 5. Create Templates
  await prisma.template.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      title: 'Asosiy Katalog va Narxlar',
      messageText: 'Salom! Artel Comfort do‘konimizning to‘liq narxlar katalogi va rasmlari quyidagi havolada: {link}',
      cardTitle: 'Artel Comfort — Maishiy Texnika Katalogi',
      cardDescription: 'Konditsionerlar, muzlatgichlar va televizorlar eng qulay narxlarda. Toshkent bo‘yicha bepul yetkazib berish!',
      cardImageUrl: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
      price: 4850000,
      ctaTelegramLink: 'https://t.me/artel_support',
      ctaMapsLink: 'https://yandex.uz/maps/-/CDR5UUlB',
      isAutoPilotDefault: true,
    },
  });

  await prisma.template.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      title: 'Do‘kon Manzili va Ish Vaqti',
      messageText: 'Bizning do‘konimiz manzili, xaritadagi lokatsiyasi va ish vaqti: {link}',
      cardTitle: 'Artel Chilonzor Filial Manzili',
      cardDescription: 'Har kuni 09:00 dan 21:00 gacha xizmatingizdamiz. Mo‘ljal: Mirzo Ulug‘bek metrosi ro‘parasida.',
      cardImageUrl: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800&auto=format&fit=crop&q=80',
      price: 0,
      ctaTelegramLink: 'https://t.me/artel_support',
      ctaMapsLink: 'https://yandex.uz/maps/-/CDR5UUlB',
      isAutoPilotDefault: false,
    },
  });

  // 6. CREATE STANDARD CRM PIPELINE STAGES
  const stageLead = await prisma.pipelineStage.create({
    data: {
      organizationId: org.id,
      name: 'Yangi Lead',
      orderIndex: 0,
      color: '#3b82f6', // Blue
    },
  });

  const stageOpened = await prisma.pipelineStage.create({
    data: {
      organizationId: org.id,
      name: 'Havola Ochildi',
      orderIndex: 1,
      color: '#8b5cf6', // Purple
    },
  });

  const stageNegotiation = await prisma.pipelineStage.create({
    data: {
      organizationId: org.id,
      name: 'Muzokarada',
      orderIndex: 2,
      color: '#f59e0b', // Amber
    },
  });

  const stageOrder = await prisma.pipelineStage.create({
    data: {
      organizationId: org.id,
      name: 'Buyurtma / To‘lov',
      orderIndex: 3,
      color: '#06b6d4', // Cyan
    },
  });

  const stageWon = await prisma.pipelineStage.create({
    data: {
      organizationId: org.id,
      name: 'Yutildi (WON)',
      orderIndex: 4,
      color: '#10b981', // Emerald
      isWon: true,
    },
  });

  const stageLost = await prisma.pipelineStage.create({
    data: {
      organizationId: org.id,
      name: 'Yo‘qotildi',
      orderIndex: 5,
      color: '#ef4444', // Red
      isLost: true,
    },
  });

  // 7. Create Demo Customers with full 360 data
  const customer1 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      assignedUserId: operatorUser.id,
      phoneNumber: '+998901234567',
      fullName: 'Jamshid Karimov',
      companyName: 'Karimov Logistics',
      address: 'Chilonzor 9-mavze, 12-uy',
      tags: 'VIP,Konditsioner',
      totalOrders: 2,
      totalSpent: 8900000,
      lastCallAt: new Date(Date.now() - 3600000 * 2),
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      assignedUserId: operatorUser.id,
      phoneNumber: '+998935554433',
      fullName: 'Dilshod Rustamov',
      address: 'Yunusobod 12',
      tags: 'Sovuq,Katalog so‘radi',
      totalOrders: 0,
      totalSpent: 0,
      lastCallAt: new Date(Date.now() - 3600000 * 5),
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      organizationId: org.id,
      assignedUserId: operatorUser.id,
      phoneNumber: '+998971112244',
      fullName: 'Malika Karimova',
      tags: 'Doimiy,Muzlatgich',
      totalOrders: 1,
      totalSpent: 6200000,
      lastCallAt: new Date(Date.now() - 3600000 * 24),
    },
  });

  // 8. Create Deals across Pipeline Stages
  await prisma.deal.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      customerId: customer1.id,
      stageId: stageNegotiation.id,
      assignedUserId: operatorUser.id,
      title: 'Artel Inverter 12 HD Konditsioner xaridi',
      amount: 4850000,
      status: 'OPEN',
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      customerId: customer2.id,
      stageId: stageOpened.id,
      assignedUserId: operatorUser.id,
      title: 'Narxlar katalogi va yetkazib berish shartlari',
      amount: 3200000,
      status: 'OPEN',
    },
  });

  await prisma.deal.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      customerId: customer3.id,
      stageId: stageWon.id,
      assignedUserId: operatorUser.id,
      title: 'Artel No-Frost Muzlatgich yetkazildi',
      amount: 6200000,
      status: 'WON',
    },
  });

  // 9. Create Customer Notes (Internal Timeline)
  await prisma.customerNote.create({
    data: {
      organizationId: org.id,
      customerId: customer1.id,
      userId: operatorUser.id,
      content: 'Mijoz 2 xonali kvartirasi uchun konditsioner so‘radi. Oq ranglisiga qiziqdi, o‘rnatish xizmati narxini tushuntirdim.',
    },
  });

  await prisma.customerNote.create({
    data: {
      organizationId: org.id,
      customerId: customer2.id,
      userId: operatorUser.id,
      content: 'SMS orqali yuborilgan narxlar ro‘yxatini ochib ko‘rdi, ertaga qaror qiladi.',
    },
  });

  // 10. Create CRM Tasks / Callbacks
  await prisma.crmTask.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      customerId: customer1.id,
      assignedUserId: operatorUser.id,
      title: 'Jamshid akaga montaj vaqti bo‘yicha qayta qo‘ng‘iroq qilish',
      dueDate: new Date(Date.now() + 3600000 * 3), // In 3 hours
      priority: 'HIGH',
      status: 'PENDING',
    },
  });

  await prisma.crmTask.create({
    data: {
      organizationId: org.id,
      branchId: mainBranch.id,
      customerId: customer2.id,
      assignedUserId: operatorUser.id,
      title: 'Dilshod aka bilan narx bo‘yicha qayta bog‘lanish',
      dueDate: new Date(Date.now() + 3600000 * 24), // Tomorrow
      priority: 'MEDIUM',
      status: 'PENDING',
    },
  });

  console.log('CRM Seed completed successfully!');
  console.log(`Pipeline Stages created: 6`);
  console.log(`Demo Deals: 3, Notes: 2, Tasks: 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
