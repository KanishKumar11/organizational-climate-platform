import bcrypt from 'bcryptjs';
import { connectDB } from './mongodb';
import User, { IUser } from '@/models/User';
import { generateSecurePassword } from '@/lib/utils';

export interface UserCredentials {
  username: string;
  password: string;
  temporaryPassword: boolean;
}

export interface BulkUserCreationData {
  name: string;
  email: string;
  role: 'employee' | 'supervisor' | 'leader';
  department_id: string;
  company_id: string;
  demographics?: {
    gender?: string;
    education_level?: string;
    job_title?: string;
    hierarchy_level?: string;
    work_location?: string;
    site_location?: string;
    tenure_months?: number;
  };
}

export interface UserCreationResult {
  user: IUser;
  credentials: UserCredentials;
  success: boolean;
  error?: string;
}

export class UserCredentialService {
  /**
   * Generate a secure temporary password
   */
  static generateTemporaryPassword(): string {
    return generateSecurePassword(12);
  }

  /**
   * Create a single user with credentials
   */
  static async createUserWithCredentials(
    userData: BulkUserCreationData
  ): Promise<UserCreationResult> {
    try {
      await connectDB();

      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        return {
          user: existingUser,
          credentials: { username: '', password: '', temporaryPassword: false },
          success: false,
          error: 'User already exists',
        };
      }

      // Generate temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      // Create user
      const user = await User.create({
        name: userData.name,
        email: userData.email,
        password_hash: passwordHash,
        role: userData.role,
        company_id: userData.company_id,
        department_id: userData.department_id,
        demographics: userData.demographics || {},
        is_active: true,
      });

      const credentials: UserCredentials = {
        username: userData.email, // Use email as username
        password: temporaryPassword,
        temporaryPassword: true,
      };

      return {
        user,
        credentials,
        success: true,
      };
    } catch (error) {
      return {
        user: {} as IUser,
        credentials: { username: '', password: '', temporaryPassword: false },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create multiple users with credentials (bulk import)
   */
  static async createBulkUsersWithCredentials(
    usersData: BulkUserCreationData[]
  ): Promise<UserCreationResult[]> {
    const results: UserCreationResult[] = [];

    for (const userData of usersData) {
      const result = await this.createUserWithCredentials(userData);
      results.push(result);
    }

    return results;
  }

  /**
   * Reset user password and generate new temporary credentials
   */
  static async resetUserCredentials(userId: string): Promise<UserCredentials | null> {
    try {
      await connectDB();

      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // Generate new temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      // Update user password
      user.password_hash = passwordHash;
      await user.save();

      return {
        username: user.email,
        password: temporaryPassword,
        temporaryPassword: true,
      };
    } catch (error) {
      console.error('Error resetting user credentials:', error);
      return null;
    }
  }

  /**
   * Get user credentials for invitation (for existing users)
   */
  static async getUserCredentialsForInvitation(userId: string): Promise<UserCredentials | null> {
    try {
      await connectDB();

      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      // If user doesn't have a password (OAuth user), generate temporary password
      if (!user.password_hash) {
        const temporaryPassword = this.generateTemporaryPassword();
        const passwordHash = await bcrypt.hash(temporaryPassword, 12);

        user.password_hash = passwordHash;
        await user.save();

        return {
          username: user.email,
          password: temporaryPassword,
          temporaryPassword: true,
        };
      }

      // For existing users with passwords, we can't retrieve the plain password
      // So we generate a new temporary password
      return await this.resetUserCredentials(userId);
    } catch (error) {
      console.error('Error getting user credentials for invitation:', error);
      return null;
    }
  }

  /**
   * Validate user credentials
   */
  static async validateCredentials(email: string, password: string): Promise<IUser | null> {
    try {
      await connectDB();

      const user = await User.findOne({ email, is_active: true }).select('+password_hash');
      if (!user || !user.password_hash) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        return null;
      }

      // Update last login
      user.last_login = new Date();
      await user.save();

      return user;
    } catch (error) {
      console.error('Error validating credentials:', error);
      return null;
    }
  }

  /**
   * Mark password as changed (no longer temporary)
   */
  static async markPasswordChanged(userId: string): Promise<boolean> {
    try {
      await connectDB();

      const user = await User.findById(userId);
      if (!user) {
        return false;
      }

      // You could add a field to track if password is temporary
      // For now, we'll just update the updated_at timestamp
      user.updated_at = new Date();
      await user.save();

      return true;
    } catch (error) {
      console.error('Error marking password as changed:', error);
      return false;
    }
  }
}

export default UserCredentialService;
