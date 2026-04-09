const { PrismaClient } = require('./app/generated/prisma/client');
const slugify = require('slugify');

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  for (const cat of categories) {
    const slug = slugify(cat.name, { lower: true });
    await prisma.category.update({
      where: { id: cat.id },
      data: { slug }
    });
  }
  console.log('Updated', categories.length, 'categories');
}

main()
  .then(() => prisma.$disconnect())
  .catch(err => { console.error(err); prisma.$disconnect(); });
