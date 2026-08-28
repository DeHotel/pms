const bcrypt = require("bcryptjs");

const prisma = require("../src/config/prisma");

async function seedHotel() {
  const existing = await prisma.hotel.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  const hotel = await prisma.hotel.create({
    data: {
      name: process.env.SEED_HOTEL_NAME || "Mi Hotel",
      primaryColor: "#2563eb",
      currency: "ARS",
    },
  });

  console.log(`Hotel creado: ${hotel.name} (podés renombrarlo y cambiar el color desde Configuración).`);
  return hotel;
}

async function seedAdmin(hotelId) {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@hotel.com";
  const password = process.env.SEED_ADMIN_PASSWORD || "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario con email ${email}, no se creó nada.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      hotelId,
      email,
      passwordHash,
      name: "Administrador",
      role: "ADMIN",
    },
  });

  console.log(`Usuario admin creado: ${email} / ${password}`);
  console.log("Cambiá esta contraseña apenas puedas iniciar sesión.");
}

async function seedRooms(hotelId) {
  const types = [
    { name: "Individual", description: "Habitación individual", basePrice: 15000, capacity: 1 },
    { name: "Doble", description: "Habitación doble", basePrice: 22000, capacity: 2 },
    { name: "Suite", description: "Suite con living", basePrice: 38000, capacity: 4 },
  ];

  for (const t of types) {
    await prisma.roomType.upsert({
      where: { hotelId_name: { hotelId, name: t.name } },
      update: {},
      create: { ...t, hotelId },
    });
  }

  const individual = await prisma.roomType.findUnique({
    where: { hotelId_name: { hotelId, name: "Individual" } },
  });
  const doble = await prisma.roomType.findUnique({
    where: { hotelId_name: { hotelId, name: "Doble" } },
  });
  const suite = await prisma.roomType.findUnique({
    where: { hotelId_name: { hotelId, name: "Suite" } },
  });

  const rooms = [
    { number: "101", floor: 1, roomTypeId: individual.id },
    { number: "102", floor: 1, roomTypeId: individual.id },
    { number: "201", floor: 2, roomTypeId: doble.id },
    { number: "202", floor: 2, roomTypeId: doble.id },
    { number: "301", floor: 3, roomTypeId: suite.id },
  ];

  for (const r of rooms) {
    await prisma.room.upsert({
      where: { hotelId_number: { hotelId, number: r.number } },
      update: {},
      create: { ...r, hotelId },
    });
  }

  console.log("Tipos de habitación y habitaciones de ejemplo creados/verificados.");
}

async function seedSuperAdmin() {
  const email = process.env.SEED_SUPERADMIN_EMAIL || "superadmin@pms.local";
  const password = process.env.SEED_SUPERADMIN_PASSWORD || "superadmin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Ya existe un usuario con email ${email}, no se creó nada.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      hotelId: null,
      email,
      passwordHash,
      name: "Super Admin",
      role: "SUPER_ADMIN",
    },
  });

  console.log(`Usuario super admin creado: ${email} / ${password}`);
  console.log("No pertenece a ningún hotel: puede crear hoteles nuevos y usuarios en cualquiera de ellos, desde /hoteles.");
}

async function main() {
  const hotel = await seedHotel();
  await seedAdmin(hotel.id);
  await seedRooms(hotel.id);
  await seedSuperAdmin();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
