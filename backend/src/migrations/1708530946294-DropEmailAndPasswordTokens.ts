import { MigrationInterface, QueryRunner } from "typeorm";

export class DropEmailAndPasswordTokens1708530946294 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'DROP COLUMN emailVerificationToken'
          + ', DROP COLUMN passwordResetToken , ' +
          'DROP COLUMN emailUpdateToken'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
          'ALTER TABLE users ' +
          'ADD COLUMN emailVerificationToken varchar'
          + ', ADD COLUMN passwordResetToken varchar, ' +
          'ADD COLUMN emailUpdateToken varchar'
        )
    }

}
