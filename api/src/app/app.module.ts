import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './services/app.service';
import { AppGateway } from './app.gateway';
import { Helper } from '../helper/helper';
import { DatabaseModule } from './database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuestionsService } from './services/questions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsEntity } from './entities/questions.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule.forRoot(),
    TypeOrmModule.forFeature([QuestionsEntity]),
  ],
  controllers: [AppController],
  providers: [AppService, AppGateway, Helper, QuestionsService],
  exports: [QuestionsService],
})
export class AppModule {}
