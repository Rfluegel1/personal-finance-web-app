import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity('todos')
export default class Todo {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4();

    @Column({ type: 'varchar' })
    task: string;

    @Column({ type: 'varchar', name:'createdby'})
    createdBy: string;

    constructor(task: string = '', createdBy: string = '') {
        this.task = task;
        this.createdBy = createdBy;
    }

    updateDefinedFields(task: string, createdBy: string): void {
        if (task !== undefined) {
            this.task = task;
        }
        if (createdBy !== undefined) {
            this.createdBy = createdBy;
        }
    }
}
