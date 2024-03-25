import {MigrationInterface, QueryRunner} from 'typeorm'

export class CreatePostsTable1693066606158 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'CREATE TABLE posts ( ' +
            'id UUID PRIMARY KEY, ' +
            'userId VARCHAR, ' +
            'title VARCHAR, ' +
            'body VARCHAR ' +
            ')',
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            'DROP TABLE posts'
        )

    }

}
