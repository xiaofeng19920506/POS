import { PrismaClient, Role, TableShape, TableStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floorPlan.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.store.deleteMany();

  const store = await prisma.store.create({
    data: {
      name: "Demo Restaurant",
      displayName: "POS",
      primaryColor: "#1B4D3E",
      accentColor: "#C4A35A",
      address: "123 Main Street",
    },
  });

  const pinHash = await bcrypt.hash("1234", 10);

  await prisma.staff.createMany({
    data: [
      {
        storeId: store.id,
        employeeId: "1001",
        name: "店长 Alex",
        pinHash,
        role: Role.MANAGER,
      },
      {
        storeId: store.id,
        employeeId: "2001",
        name: "收银 Sam",
        pinHash,
        role: Role.CASHIER,
      },
      {
        storeId: store.id,
        employeeId: "3001",
        name: "服务员 Jordan",
        pinHash,
        role: Role.SERVER,
      },
      {
        storeId: store.id,
        employeeId: "4001",
        name: "后厨 Casey",
        pinHash,
        role: Role.KITCHEN,
      },
    ],
  });

  const floor = await prisma.floorPlan.create({
    data: {
      storeId: store.id,
      name: "一楼大厅",
      aspectW: 16,
      aspectH: 10,
    },
  });

  const tables = [
    { name: "窗边1", number: "1", xPct: 8, yPct: 12, wPct: 9, hPct: 14, shape: TableShape.round, seats: 2 },
    { name: "窗边2", number: "2", xPct: 22, yPct: 12, wPct: 9, hPct: 14, shape: TableShape.round, seats: 2 },
    { name: "大厅A", number: "3", xPct: 40, yPct: 18, wPct: 11, hPct: 16, shape: TableShape.square, seats: 4 },
    { name: "大厅B", number: "4", xPct: 56, yPct: 18, wPct: 11, hPct: 16, shape: TableShape.square, seats: 4 },
    { name: "大厅C", number: "5", xPct: 72, yPct: 18, wPct: 11, hPct: 16, shape: TableShape.square, seats: 4 },
    { name: "包厢1", number: "6", xPct: 10, yPct: 45, wPct: 14, hPct: 20, shape: TableShape.square, seats: 8 },
    { name: "包厢2", number: "7", xPct: 30, yPct: 45, wPct: 14, hPct: 20, shape: TableShape.square, seats: 8 },
    { name: "吧台1", number: "8", xPct: 55, yPct: 55, wPct: 8, hPct: 12, shape: TableShape.round, seats: 2 },
    { name: "吧台2", number: "9", xPct: 68, yPct: 55, wPct: 8, hPct: 12, shape: TableShape.round, seats: 2 },
    { name: "吧台3", number: "10", xPct: 81, yPct: 55, wPct: 8, hPct: 12, shape: TableShape.round, seats: 2 },
  ];

  for (const [i, t] of tables.entries()) {
    await prisma.table.create({
      data: {
        floorPlanId: floor.id,
        ...t,
        status: TableStatus.available,
        sortOrder: i,
      },
    });
  }

  const cats = [
    {
      name: "开胃小食",
      items: [
        { name: "春卷", priceCents: 699, description: "脆皮蔬菜春卷" },
        { name: "锅贴", priceCents: 899, description: "猪肉白菜锅贴" },
        { name: "凉拌黄瓜", priceCents: 599 },
      ],
    },
    {
      name: "主食面点",
      items: [
        { name: "牛肉面", priceCents: 1499, description: "红烧牛肉汤面" },
        { name: "炒饭", priceCents: 1199 },
        { name: "饺子（12个）", priceCents: 1299 },
      ],
    },
    {
      name: "热菜",
      items: [
        { name: "宫保鸡丁", priceCents: 1599 },
        { name: "麻婆豆腐", priceCents: 1299 },
        { name: "清炒时蔬", priceCents: 999 },
        { name: "红烧排骨", priceCents: 1899 },
      ],
    },
    {
      name: "饮品",
      items: [
        { name: "热茶", priceCents: 299 },
        { name: "柠檬水", priceCents: 399 },
        { name: "可乐", priceCents: 299 },
      ],
    },
  ];

  for (const [ci, cat] of cats.entries()) {
    const category = await prisma.category.create({
      data: {
        storeId: store.id,
        name: cat.name,
        sortOrder: ci,
      },
    });
    for (const [ii, item] of cat.items.entries()) {
      const menuItem = await prisma.menuItem.create({
        data: {
          categoryId: category.id,
          name: item.name,
          description: item.description ?? null,
          priceCents: item.priceCents,
          sortOrder: ii,
        },
      });
      if (item.name === "宫保鸡丁" || item.name === "麻婆豆腐") {
        const group = await prisma.modifierGroup.create({
          data: {
            menuItemId: menuItem.id,
            name: "辣度",
            required: true,
            minSelect: 1,
            maxSelect: 1,
          },
        });
        await prisma.modifierOption.createMany({
          data: [
            { modifierGroupId: group.id, name: "微辣", priceCents: 0 },
            { modifierGroupId: group.id, name: "中辣", priceCents: 0 },
            { modifierGroupId: group.id, name: "特辣", priceCents: 0 },
          ],
        });
      }
    }
  }

  console.log("Seed complete.");
  console.log("Login: employeeId 1001 / PIN 1234 (manager)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
