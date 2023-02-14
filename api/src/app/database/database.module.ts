import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import * as process from 'process';

@Module({})
export class DatabaseModule {
  static forRoot(): DynamicModule {
    console.log(process.env.DATABASE_HOST);
    return TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [join(__dirname, '../**', '*.entity.{ts,js}')],
      logging: process.env.NODE_ENV == 'production' ? ['error'] : true,
    });
  }
}
