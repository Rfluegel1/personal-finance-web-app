import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsVerifiedAndEmailVerificationToken1707489842745 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'ADD COLUMN isVerified boolean DEFAULT false, ' +
          'ADD COLUMN emailVerificationToken varchar'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'DROP COLUMN isVerified, ' +
          'DROP COLUMN emailVerificationToken'
        )
    }

}
