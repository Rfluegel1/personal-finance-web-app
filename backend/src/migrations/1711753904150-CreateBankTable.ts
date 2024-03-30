import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBankTable1711753904150 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE banks ( ' +
            'id UUID PRIMARY KEY, ' +
            'accessToken VARCHAR, ' +
            'owner VARCHAR' +
            ')',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP TABLE banks'
        )

    }

}
