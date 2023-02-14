import { InjectRepository } from '@nestjs/typeorm';
import { QuestionsEntity } from '../entities/questions.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(QuestionsEntity)
    private readonly questionRepository: Repository<QuestionsEntity>,
  ) {}

  async getQuestions() {
    const query = this.questionRepository.createQueryBuilder('q');
    return query.getMany();
  }
}
