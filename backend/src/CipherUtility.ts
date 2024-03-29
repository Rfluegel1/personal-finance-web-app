import crypto from 'crypto'

export class CipherUtility {
    private static algorithm = 'aes-256-cbc'
    private static key = Buffer.from(process.env.CIPHER_KEY as string, 'hex')
    private static initializationVector = crypto.randomBytes(16)

    static encrypt(text: string): string {
        let cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.key), this.initializationVector)
        let encrypted = cipher.update(text)
        encrypted = Buffer.concat([encrypted, cipher.final()])
        return `${this.initializationVector.toString('hex')}:${encrypted.toString('hex')}`
    }

    static decrypt(text: string): string {
        let [iv, encryptedText] = text.split(':')
        let decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.key), Buffer.from(iv, 'hex'))
        let decrypted = decipher.update(Buffer.from(encryptedText, 'hex'))
        decrypted = Buffer.concat([decrypted, decipher.final()])
        return decrypted.toString()
    }
}