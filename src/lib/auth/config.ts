import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import LinkedInProvider from 'next-auth/providers/linkedin'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'
import type { Adapter } from 'next-auth/adapters'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    // LinkedIn OAuth for production
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
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

              const user = await prisma.user.findUnique({
                where: { email: credentials.email },
              })

              if (!user || !user.passwordHash) {
                throw new Error('Invalid credentials')
              }

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
    async jwt({ token, user, account, profile }) {
      // Initial sign in
      if (user) {
        token.id = user.id
      }

      // LinkedIn OAuth - update user profile with LinkedIn data
      if (account?.provider === 'linkedin' && profile) {
        await prisma.user.update({
          where: { id: token.id as string },
          data: {
            linkedin_url: profile.sub ? `https://www.linkedin.com/in/${profile.sub}` : null,
          },
        })
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },

  debug: process.env.NODE_ENV === 'development',
}
