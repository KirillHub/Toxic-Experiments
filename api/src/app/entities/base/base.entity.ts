import { PrimaryGeneratedColumn } from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int4' })
  id: number;
}
