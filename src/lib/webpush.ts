import webpush from 'web-push';
import prisma from './prisma';

if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys are not configured');
}

webpush.setVapidDetails(
  'mailto:gymtrack@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function subscribeUser(
  userId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscribed: true,
        pushEndpoint: subscription.endpoint,
        pushP256dh: subscription.p256dh,
        pushAuth: subscription.auth,
      },
    });
    return true;
  } catch (error) {
    console.error('Error subscribing user:', error);
    return false;
  }
}

export async function unsubscribeUser(userId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        pushSubscribed: false,
        pushEndpoint: null,
        pushP256dh: null,
        pushAuth: null,
      },
    });
    return true;
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return false;
  }
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pushEndpoint: true,
        pushP256dh: true,
        pushAuth: true,
      },
    });

    if (!user?.pushEndpoint || !user.pushP256dh || !user.pushAuth) {
      return false;
    }

    const subscription = {
      endpoint: user.pushEndpoint,
      keys: {
        p256dh: user.pushP256dh,
        auth: user.pushAuth,
      },
    };

    const payload = JSON.stringify({
      title,
      body,
      ...data,
    });

    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

export async function getVapidPublicKey(): Promise<string> {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
}
