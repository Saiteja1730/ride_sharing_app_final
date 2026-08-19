import { User, IUserDocument } from '../../models/User';

export class UserRepository {
  public async findByEmail(email: string): Promise<IUserDocument | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  public async findById(id: string): Promise<IUserDocument | null> {
    return User.findById(id);
  }

  public async create(userData: Partial<IUserDocument>): Promise<IUserDocument> {
    return User.create(userData);
  }

  public async updateById(id: string, updateData: Partial<IUserDocument>): Promise<IUserDocument | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true });
  }

  public async countDrivers(): Promise<number> {
    return User.countDocuments({ role: 'driver', isAvailable: true, kycStatus: 'approved' });
  }
}
