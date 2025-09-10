import { type User } from '../schema';

export async function getAllUsers(): Promise<User[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all users from the database.
    // This is an admin-only function for user management purposes.
    return Promise.resolve([
        {
            id: 1,
            email: 'jobseeker@example.com',
            password_hash: 'hashed_password',
            role: 'job_seeker',
            first_name: 'Jane',
            last_name: 'Smith',
            phone: '+1234567890',
            created_at: new Date(),
            updated_at: new Date()
        },
        {
            id: 2,
            email: 'company@example.com',
            password_hash: 'hashed_password',
            role: 'company',
            first_name: 'John',
            last_name: 'Corporate',
            phone: null,
            created_at: new Date(),
            updated_at: new Date()
        }
    ] as User[]);
}