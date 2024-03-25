import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswrodResetToken1708014750534 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'ADD COLUMN passwordResetToken varchar'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'DROP COLUMN passwordResetToken'
        )
    }

}
