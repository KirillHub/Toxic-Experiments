import { DataSource } from 'typeorm';

const dataSource = new DataSource({
  name: 'mirror-console',
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number.parseInt(process.env.DATABASE_PORT, 5432),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  migrations: ['src/migrations/*.ts'],
  entities: ['src/**/*.entity.ts'],
  logging: ['error'],
});

export default dataSource;
