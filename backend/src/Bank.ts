import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('banks')
export default class Bank {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column({ type: 'varchar', name: 'accesstoken' })
    accessToken: string;

    @Column({ type: 'varchar'})
    owner: string;

    constructor(accessToken: string = '', owner: string = '') {
        this.accessToken = accessToken;
        this.owner = owner;
    }

    updateDefinedFields(task: string, owner: string): void {
        if (task !== undefined) {
            this.accessToken = task;
        }
        if (owner !== undefined) {
            this.owner = owner;
        }
    }
}
