import { auth, clerkClient } from '@clerk/nextjs/server';
import prisma from './prisma';

export interface SyncedUser {
  id: string;
  clerkId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export async function syncUser(): Promise<SyncedUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress || '';

    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {
        email,
        name: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
      },
      create: {
        clerkId: userId,
        email,
        name: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
      },
    });

    return user;
  } catch (error) {
    console.error('Error syncing user:', error);
    return null;
  }
}

export async function getCurrentUser(): Promise<SyncedUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getUserId(): Promise<string | null> {
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}
