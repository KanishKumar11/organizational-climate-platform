import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { Profile } from 'next-auth';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import Company from '../models/Company';
import AuditLog from '../models/AuditLog';
import { connectDB } from './db';

// Extended profile interface for additional properties
interface ExtendedProfile extends Profile {
  ip_address?: string;
}

// Log environment variables for debugging (without exposing secrets)
console.log('Auth configuration check:', {
  hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
  hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
  hasMongoUri: !!process.env.MONGODB_URI,
  hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
  nextAuthUrl: process.env.NEXTAUTH_URL,
});

export const authOptions: NextAuthOptions = {
  // Remove adapter to handle user creation manually in callbacks
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Ensure MongoDB connection is established
          await connectDB();
          console.log('Attempting credentials login for:', credentials.email);

          // Find user by email (include password_hash for verification)
          const user = await (User as any)
            .findOne(
              {
                email: credentials.email.toLowerCase(),
                is_active: true,
              },
              null,
              { skipPrivacy: true }
            )
            .select('+password_hash');

          if (!user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          if (!user.password_hash) {
            console.log(
              'User has no password hash (OAuth user?):',
              credentials.email
            );
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          // Update last login
          user.last_login = new Date();
          await user.save();

          console.log('Credentials login successful for:', credentials.email);
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.company_id,
            departmentId: user.department_id,
            isActive: user.is_active,
          };
        } catch (error) {
          console.error('Credentials auth error:', error);
          return null;
        }
      },
    }),
    // Add more providers as needed (Microsoft, SAML, etc.)
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60 * 10, // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('=== SignIn Callback Started ===');
      console.log('User:', {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      });
      console.log('Account:', {
        provider: account?.provider,
        type: account?.type,
        providerAccountId: account?.providerAccountId,
      });
      console.log('Profile:', {
        id: (profile as any)?.id || (profile as any)?.sub,
        name: profile?.name,
        email: profile?.email,
      });

      try {
        // Ensure MongoDB connection is established
        await connectDB();
        console.log('MongoDB connection established for auth callback');

        if (!user.email) {
          console.error('SignIn failed: No email provided');
          return false;
        }

        // Extract domain from email
        const domain = user.email.split('@')[1];
        console.log('Extracted domain:', domain);

        // Find company by domain
        let company = await (Company as any).findOne({
          domain: domain.toLowerCase(),
          is_active: true,
        });
        console.log(
          'Found existing company:',
          company
            ? { id: company._id, name: company.name, domain: company.domain }
            : 'None'
        );

        // Create company if it doesn't exist (for Google OAuth auto-registration)
        if (!company) {
          console.log('Creating new company for domain:', domain);
          try {
            company = await (Company as any).create({
              name: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Organization`,
              domain: domain.toLowerCase(),
              industry: 'General',
              size: 'medium',
              country: 'Unknown',
              subscription_tier: 'basic',
              is_active: true,
            });
            console.log('Created new company:', {
              id: company._id,
              name: company.name,
              domain: company.domain,
            });
          } catch (companyError) {
            console.error('Error creating company:', companyError);
            // Try to find the company again in case it was created by another request
            company = await (Company as any).findOne({
              domain: domain.toLowerCase(),
              is_active: true,
            });
            if (!company) {
              console.error(
                'Failed to create or find company for domain:',
                domain
              );
              return false;
            }
          }
        }

        // Check if user already exists (use lowercase for consistency with schema)
        const searchEmail = user.email.toLowerCase();
        console.log('Searching for user with email:', searchEmail);

        let existingUser = await (User as any).findOne(
          {
            email: searchEmail,
          },
          null,
          { skipPrivacy: true }
        );
        console.log(
          'Found existing user:',
          existingUser
            ? {
                id: existingUser._id,
                email: existingUser.email,
                role: existingUser.role,
              }
            : 'None'
        );

        // Additional debugging - let's see if there are any users in the database
        const userCount = await User.countDocuments();
        console.log('Total users in database:', userCount);

        // Let's also try to find any user with similar email
        const similarUsers = await (User as any)
          .find({
            email: { $regex: searchEmail.split('@')[0], $options: 'i' },
          })
          .limit(5);
        console.log(
          'Similar users found:',
          similarUsers.map((u) => ({ email: u.email, id: u._id }))
        );

        if (!existingUser) {
          console.log('Creating new user for email:', user.email);
          try {
            // Create new user with default employee role
            existingUser = await (User as any).create({
              name: user.name || 'Unknown User',
              email: user.email.toLowerCase(),
              role: 'employee',
              company_id: company._id.toString(),
              department_id: 'unassigned', // Will be assigned by admin
              is_active: true,
            });
            console.log('Created new user:', {
              id: existingUser._id,
              email: existingUser.email,
              role: existingUser.role,
            });
          } catch (userError) {
            console.error('Error creating user:', userError);
            // Try to find the user again in case it was created by another request
            existingUser = await (User as any).findOne(
              {
                email: user.email.toLowerCase(),
              },
              null,
              { skipPrivacy: true }
            );
            if (!existingUser) {
              console.error('Failed to create or find user:', user.email);
              return false;
            }
          }

          // Log user creation
          await (AuditLog as any).create({
            user_id: existingUser._id.toString(),
            company_id: company._id.toString(),
            action: 'create',
            resource: 'user',
            resource_id: existingUser._id.toString(),
            details: {
              provider: account?.provider,
              email: user.email,
              name: user.name,
            },
            success: true,
            timestamp: new Date(),
          });
        }

        // Update last login
        existingUser.last_login = new Date();
        await existingUser.save();

        // Log successful login
        await (AuditLog as any).create({
          user_id: existingUser._id.toString(),
          company_id: existingUser.company_id,
          action: 'login',
          resource: 'user',
          resource_id: existingUser._id.toString(),
          details: {
            provider: account?.provider,
            ip_address: (profile as ExtendedProfile)?.ip_address,
          },
          success: true,
          timestamp: new Date(),
        });

        console.log('SignIn successful for user:', user.email);
        console.log('=== SignIn Callback Completed Successfully ===');
        return true;
      } catch (error) {
        console.error('=== SignIn Callback Error ===');
        console.error('SignIn error for user:', user.email);
        console.error('Error details:', error);
        console.error(
          'Error stack:',
          error instanceof Error ? error.stack : 'No stack trace'
        );
        console.log('=== SignIn Callback Failed ===');
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user && user.email) {
        // Ensure MongoDB connection is established
        await connectDB();
        // Fetch user data from our database
        const dbUser = await (User as any).findOne(
          { email: user.email.toLowerCase() },
          null,
          { skipPrivacy: true }
        );
        if (dbUser) {
          token.userId = dbUser._id.toString();
          token.role = dbUser.role;
          token.companyId = dbUser.company_id;
          token.departmentId = dbUser.department_id;
          token.isActive = dbUser.is_active;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token && token.userId) {
        session.user.id = token.userId;
        session.user.role = token.role || 'employee';
        session.user.companyId = token.companyId || '';
        session.user.departmentId = token.departmentId || '';
        session.user.isActive = token.isActive || false;
      }
      return session;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Redirect to dashboard after successful login
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.userId && token?.companyId) {
        try {
          // Log successful logout
          await (AuditLog as any).create({
            user_id: token.userId,
            company_id: token.companyId,
            action: 'logout',
            resource: 'user',
            resource_id: token.userId,
            details: {},
            success: true,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Error logging signOut:', error);
        }
      }
    },
  },
};

// Helper function to get server-side session
export async function getServerSession() {
  const { getServerSession } = await import('next-auth');
  return getServerSession(authOptions);
}

// Helper function to get user from session
export async function getCurrentUser() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return null;
  }

  return await (User as any).findOne(
    { email: session.user.email.toLowerCase() },
    null,
    {
      skipPrivacy: true,
    }
  );
}
