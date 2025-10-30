import { createAgentSchema } from '../agent'

describe('Agent Validation', () => {
  const validAgentData = {
    name: 'Test Agent',
    description: 'A valid test agent description that is at least ten characters long',
    platforms: ['550e8400-e29b-41d4-a716-446655440000'], // Valid UUID
    category_id: '550e8400-e29b-41d4-a716-446655440001', // Valid UUID
    tags: ['test', 'agent'],
    is_public: true,
  }

  describe('XSS Prevention', () => {
    it('should sanitize XSS in name', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        name: '<script>alert("xss")</script>Test Agent',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).not.toContain('<script>')
        expect(result.data.name).not.toContain('alert')
      }
    })

    it('should sanitize XSS in description', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        description: '<script>alert("xss")</script>Valid description',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).not.toContain('<script>')
        expect(result.data.description).not.toContain('alert')
      }
    })

    it('should remove event handlers from description', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        description: '<div onclick="malicious()">Click me</div>',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).not.toContain('onclick')
        expect(result.data.description).not.toContain('malicious')
      }
    })

    it('should sanitize javascript: protocol in links', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        description: '<a href="javascript:alert(1)">Click</a>',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).not.toContain('javascript:')
      }
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should sanitize SQL injection attempts in description', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        description: "'; DROP TABLE agents;--",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        // SQL strings are escaped by Supabase, but HTML sanitizer will strip tags
        // The string itself is preserved (parameterized queries prevent SQL injection)
        expect(result.data.description).toBe("'; DROP TABLE agents;--")
      }
    })

    it('should handle SQL injection in name', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        name: "Test' OR '1'='1",
      })

      expect(result.success).toBe(true)
      // Parameterized queries in Supabase prevent SQL injection
      // Validation just ensures proper formatting
    })
  })

  describe('Field Validation', () => {
    it('should reject name shorter than 3 characters', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        name: 'AB',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 3 characters')
      }
    })

    it('should reject name longer than 100 characters', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        name: 'A'.repeat(101),
      })

      expect(result.success).toBe(false)
    })

    it('should reject description shorter than 10 characters', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        description: 'Too short',
      })

      expect(result.success).toBe(false)
    })

    it('should reject empty platforms array', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        platforms: [],
      })

      expect(result.success).toBe(false)
    })

    it('should accept valid agent data', () => {
      const result = createAgentSchema.safeParse(validAgentData)

      expect(result.success).toBe(true)
    })
  })

  describe('Tag Validation', () => {
    it('should accept valid tags array', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        tags: ['ai', 'automation', 'testing'],
      })

      expect(result.success).toBe(true)
    })

    it('should handle empty tags array', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        tags: [],
      })

      expect(result.success).toBe(true)
    })

    it('should sanitize XSS in tags', () => {
      const result = createAgentSchema.safeParse({
        ...validAgentData,
        tags: ['<script>alert("xss")</script>', 'valid-tag'],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags[0]).not.toContain('<script>')
      }
    })
  })
})
