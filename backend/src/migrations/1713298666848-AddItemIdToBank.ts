import { MigrationInterface, QueryRunner } from "typeorm";

export class AddItemIdToBank1713298666848 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE banks ' +
            'ADD COLUMN itemId varchar'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'ALTER TABLE banks ' +
            'DROP COLUMN itemId'
        )
    }

}
