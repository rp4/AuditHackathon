import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import LinkedInProvider from 'next-auth/providers/linkedin'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'
import type { Adapter } from 'next-auth/adapters'

// Custom adapter that handles soft-deleted users
function customPrismaAdapter(prisma: any): Adapter {
  const baseAdapter = PrismaAdapter(prisma) as Adapter

  return {
    ...baseAdapter,
    async getUserByEmail(email: string) {
      // First try the base adapter
      const user = await baseAdapter.getUserByEmail!(email)

      // If no user found, check for soft-deleted users
      if (!user) {
        const deletedUser = await prisma.user.findFirst({
          where: {
            email: {
              startsWith: 'deleted_'
            },
            isDeleted: true
          }
        })
        return deletedUser
      }

      return user
    },
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId
          }
        },
        select: { user: true }
      })

      // Return user even if soft-deleted so OAuth can proceed
      return account?.user ?? null
    },
  }
}

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter(prisma),

  providers: [
    // LinkedIn OAuth for production
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      client: {
        token_endpoint_auth_method: 'client_secret_post',
      },
      authorization: {
        url: 'https://www.linkedin.com/oauth/v2/authorization',
        params: {
          scope: 'openid profile email',
        },
      },
      token: 'https://www.linkedin.com/oauth/v2/accessToken',
      userinfo: {
        url: 'https://api.linkedin.com/v2/userinfo',
      },
      issuer: 'https://www.linkedin.com/oauth',
      jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
      // Map LinkedIn profile to our user model
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          linkedin_url: profile.sub ? `https://www.linkedin.com/in/${profile.sub}` : null,
        }
      },
    }),

    // Email/Password for development only
    ...(process.env.NODE_ENV === 'development'
      ? [
          CredentialsProvider({
            name: 'Email',
            credentials: {
              email: { label: 'Email', type: 'email' },
              password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
              if (!credentials?.email || !credentials?.password) {
                throw new Error('Email and password required')
              }

              // Only look up active users - deleted accounts cannot be restored via login
              const user = await prisma.user.findUnique({
                where: {
                  email: credentials.email,
                  isDeleted: false // Explicitly exclude deleted users
                },
              })

              if (!user || !user.passwordHash) {
                throw new Error('Invalid credentials')
              }

              // Verify password
              const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
              if (!isValid) {
                throw new Error('Invalid credentials')
              }

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                image: user.image,
              }
            },
          }),
        ]
      : []),
  ],

  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Check if this is a soft-deleted user trying to sign back in
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { isDeleted: true, email: true, name: true }
        })

        // If user is soft-deleted, restore their account
        if (dbUser?.isDeleted) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isDeleted: false,
              deletedAt: null,
              email: user.email || dbUser.email,
              name: user.name || dbUser.name,
              image: user.image || null,
              // Profile fields remain cleared - user starts fresh
            }
          })
        }
      }

      return true
    },

    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        token.id = user.id

        // Fetch the user's username
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true, isDeleted: true }
        })

        // Should not be deleted at this point (restored in signIn callback)
        if (dbUser?.isDeleted) {
          return null
        }

        token.username = dbUser?.username
      }

      // LinkedIn OAuth - update user profile with LinkedIn data and generate username if needed
      if (account?.provider === 'linkedin' && profile) {
        const updates: any = {
          linkedin_url: profile.sub ? `https://www.linkedin.com/in/${profile.sub}` : null,
        }

        // Generate username from name if not exists
        const existingUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { username: true, name: true, isDeleted: true }
        })

        // Only process if user is not deleted (or was just restored above)
        if (!existingUser?.isDeleted) {
          if (!existingUser?.username && existingUser?.name) {
            // Generate username from name
            let baseUsername = existingUser.name.toLowerCase().replace(/\s+/g, '')
            let username = baseUsername
            let counter = 1

            // Check for uniqueness
            while (await prisma.user.findUnique({ where: { username } })) {
              username = `${baseUsername}${counter}`
              counter++
            }

            updates.username = username
            token.username = username
          }

          await prisma.user.update({
            where: { id: token.id as string },
            data: updates,
          })
        }
      }

      return token
    },

    async session({ session, token }) {
      // Check if the user still exists and is not deleted
      if (token?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { isDeleted: true }
        })

        // If user is deleted, return null to invalidate the session
        if (dbUser?.isDeleted) {
          return null as any
        }
      }

      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
      }
      return session
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
