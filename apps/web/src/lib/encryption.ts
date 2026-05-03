import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex')

export function encrypt(text: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  }
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex').slice(0, 32), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}

export function encryptSensitiveData(data: any): string {
  const jsonString = JSON.stringify(data)
  const { encrypted, iv, tag } = encrypt(jsonString)
  return JSON.stringify({ encrypted, iv, tag })
}

export function decryptSensitiveData(encryptedData: string): any {
  const { encrypted, iv, tag } = JSON.parse(encryptedData)
  const decrypted = decrypt(encrypted, iv, tag)
  return JSON.parse(decrypted)
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function validateToken(token: string, storedToken: string): boolean {
  return crypto.timingSafeEqual(
    Buffer.from(token),
    Buffer.from(storedToken)
  )
}