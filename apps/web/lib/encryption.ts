import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-chars-long!'
const ALGORITHM = 'aes-256-gcm'

export function encryptSensitiveData(data: any): string {
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32), iv)
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted
  } catch (error) {
    console.error('Encryption error:', error)
    throw error
  }
}

export function decryptSensitiveData(encryptedData: string): any {
  try {
    const parts = encryptedData.split(':')
    const iv = Buffer.from(parts[0], 'hex')
    const authTag = Buffer.from(parts[1], 'hex')
    const encrypted = parts[2]
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'utf8').slice(0, 32), iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Decryption error:', error)
    throw error
  }
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex')
}