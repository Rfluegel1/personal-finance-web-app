import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1707665684932 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          "ADD COLUMN role varchar DEFAULT 'user'"
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'DROP COLUMN role'
        )
    }

}
