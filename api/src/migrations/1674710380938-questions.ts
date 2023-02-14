import { MigrationInterface, QueryRunner } from "typeorm";

export class questions1674710380938 implements MigrationInterface {
    name = 'questions1674710380938'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "questions" ("id" SERIAL NOT NULL, "question" text NOT NULL, "answers" text array NOT NULL, "correctAnswer" integer NOT NULL, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "questions"`);
    }

}
