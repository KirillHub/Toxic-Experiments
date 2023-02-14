import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base/base.entity';

@Entity({ name: 'questions' })
export class QuestionsEntity extends BaseEntity {
  @Column('text', { name: 'question' })
  question: string;

  @Column('text', { name: 'answers', array: true })
  answers: string[];

  @Column('integer', { name: 'correctAnswer' })
  correctAnswer: number;
}
