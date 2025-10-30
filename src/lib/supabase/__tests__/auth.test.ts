import { validatePasswordStrength } from '../auth'

describe('Password Validation', () => {
  describe('validatePasswordStrength', () => {
    it('should require minimum 12 characters', () => {
      const result = validatePasswordStrength('Short1!')

      expect(result.valid).toBe(false)
      expect(result.feedback[0]).toContain('at least 12 characters')
    })

    it('should reject very weak passwords', () => {
      const result = validatePasswordStrength('password1234')

      expect(result.valid).toBe(false)
      expect(result.score).toBeLessThan(3)
    })

    it('should reject common passwords', () => {
      const result = validatePasswordStrength('password123456')

      expect(result.valid).toBe(false)
    })

    it('should accept strong passwords', () => {
      const result = validatePasswordStrength('MyStr0ng!P@ssw0rd2024')

      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(3)
    })

    it('should accept passphrases', () => {
      const result = validatePasswordStrength('correct horse battery staple')

      expect(result.valid).toBe(true)
      expect(result.score).toBeGreaterThanOrEqual(3)
    })

    it('should provide feedback for weak passwords', () => {
      const result = validatePasswordStrength('weakpass1234')

      expect(result.valid).toBe(false)
      expect(result.feedback).toBeDefined()
      expect(result.feedback.length).toBeGreaterThan(0)
    })

    it('should detect repeated characters', () => {
      const result = validatePasswordStrength('aaaaaaaaaaa1')

      expect(result.valid).toBe(false)
    })

    it('should detect sequential characters', () => {
      const result = validatePasswordStrength('abcdefghijk1')

      expect(result.valid).toBe(false)
    })

    it('should require minimum score of 3', () => {
      // Test various passwords to ensure score threshold
      const weakPasswords = [
        '123456789012',
        'qwertyuiopas',
        'password1234',
      ]

      weakPasswords.forEach(password => {
        const result = validatePasswordStrength(password)
        expect(result.valid).toBe(false)
      })
    })
  })
})
