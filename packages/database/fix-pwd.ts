import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany()
  console.log("Users:", users.map(u => ({ email: u.email, password: u.password, role: u.role, storeId: u.storeId })))
  
  const admin = users.find(u => u.email === 'admin@coffeeshop.tn')
  if (admin) {
    await prisma.user.update({
      where: { email: 'admin@coffeeshop.tn' },
      data: { password: 'password123' }
    })
    console.log("Updated admin password successfully!")
  } else {
    console.log("No admin@coffeeshop.tn found! Let's check store to create one.")
    const store = await prisma.store.findFirst()
    if (store) {
      await prisma.user.create({
        data: { email: 'admin@coffeeshop.tn', password: 'password123', name: 'Gérant par défaut', role: 'OWNER', storeId: store.id }
      })
      console.log("Created admin@coffeeshop.tn successfully!")
    } else {
      console.log("No store found to attach the user to.")
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
