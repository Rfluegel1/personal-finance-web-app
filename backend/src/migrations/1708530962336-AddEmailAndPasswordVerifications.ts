import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailAndPasswordVerifications1708530962336 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'ADD COLUMN emailVerification JSON'
          + ', ADD COLUMN passwordReset JSON, ' +
          'ADD COLUMN emailUpdate JSON'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'DROP COLUMN emailVerification'
          + ', DROP COLUMN passwordReset, ' +
          'DROP COLUMN emailUpdate'
        )
    }

}
