import { MigrationInterface, QueryRunner } from "typeorm"

export class DropPostsTable1707234073148 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP TABLE IF EXISTS posts'
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE posts ( ' +
            'id UUID PRIMARY KEY, ' +
            'userId VARCHAR, ' +
            'title VARCHAR, ' +
            'body VARCHAR ' +
            ')',
        )
    }

}
