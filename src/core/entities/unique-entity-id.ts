import { randomUUID } from "node:crypto"

export class UniqueEntityId{
    private value: string

    constructor(value?: string){
        this.value = value ?? randomUUID()
    }

    toValue(){
        return this.value
    }

    equals(id: UniqueEntityId){
        return id.toValue() === this.value
    }
}