import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from './user';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      companyId: string;
      departmentId: string;
      isActive: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role?: UserRole;
    companyId?: string;
    departmentId?: string;
    isActive?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId?: string;
    role?: UserRole;
    companyId?: string;
    departmentId?: string;
    isActive?: boolean;
  }
}
