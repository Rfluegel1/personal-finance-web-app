import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateTodosTable1706482307030 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE todos ( ' +
            'id UUID PRIMARY KEY, ' +
            'task VARCHAR, ' +
            'createdBy VARCHAR ' +
            ')',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP TABLE todos'
        )
    }

}
