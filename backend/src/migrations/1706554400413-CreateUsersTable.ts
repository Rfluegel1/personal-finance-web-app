import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateUsersTable1706554400413 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE users ( ' +
            'id UUID PRIMARY KEY, ' +
            'email VARCHAR UNIQUE NOT NULL, ' +
            'passwordHash VARCHAR NOT NULL' +
            ')',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP TABLE users'
        )
    }

}
