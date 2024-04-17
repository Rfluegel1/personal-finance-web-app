import {Entity, PrimaryGeneratedColumn, Column} from 'typeorm'
import {v4 as uuidv4} from 'uuid'

@Entity('banks')
export default class Bank {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4()

    @Column({type: 'varchar', name: 'accesstoken'})
    accessToken: string

    @Column({type: 'varchar'})
    owner: string

    @Column({type: 'varchar', name: 'itemid'})
    itemId: string

    constructor(accessToken: string = '', owner: string = '', itemId: string = '') {
        this.accessToken = accessToken
        this.owner = owner
        this.itemId = itemId
    }

    updateDefinedFields(accessToken: string, owner: string, itemId: string): void {
        if (accessToken !== undefined) {
            this.accessToken = accessToken
        }
        if (owner !== undefined) {
            this.owner = owner
        }
        if (itemId !== undefined) {
            this.itemId = itemId
        }
    }
}
