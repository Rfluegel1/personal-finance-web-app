import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingEmailAndEmailUpdateToken1708046655033 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'ADD COLUMN emailUpdateToken varchar, ' +
          'ADD COLUMN pendingEmail varchar'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'DROP COLUMN emailUpdateToken, ' +
          'DROP COLUMN pendingEmail'
        )
    }
}
