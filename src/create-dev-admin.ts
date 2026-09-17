/**
 * Local-development admin bootstrap.
 * Run with: npm run admin:dev
 * Never use these credentials in a deployed environment.
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { AppModule } from './app.module';
import { User } from './users/schemas/user.schema';
import { UserRole } from './common/enums';

const EMAIL = 'admin@gmail.com';
const PHONE = '+251900000000';
const PASSWORD = 'Admin123!';

async function bootstrapAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const users = app.get<Model<User>>(getModelToken(User.name));
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await users.findOneAndUpdate(
    { email: EMAIL },
    {
      $set: {
        name: 'admn',
        email: EMAIL,
        phoneNumber: PHONE,
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).exec();

  await app.close();
  console.log(`Development admin ready: ${EMAIL}`);
}

bootstrapAdmin().catch((error) => {
  console.error('Could not create development admin:', error);
  process.exit(1);
});
