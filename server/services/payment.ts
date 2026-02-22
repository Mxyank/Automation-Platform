import Razorpay from "razorpay";
import crypto from "crypto";
import { storage } from "../storage";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_eJzAWpZFW6jUMp",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "QXAErvPE9Q6zw0560UYJEOVQ",
});

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in paise (₹99 = 9900 paise)
  popular?: boolean;
}

export const creditPackages: CreditPackage[] = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 5,
    price: 9900, // ₹99
    popular: true,
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 10,
    price: 14900, // ₹149
  },
];

export async function createPaymentOrder(userId: number, packageId: string): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}> {
  const package_ = creditPackages.find(p => p.id === packageId);
  if (!package_) {
    throw new Error("Invalid package ID");
  }

  const order = await razorpay.orders.create({
    amount: package_.price,
    currency: "INR",
    receipt: `order_${userId}_${Date.now()}`,
    notes: {
      userId: userId.toString(),
      packageId: packageId,
      credits: package_.credits.toString(),
    },
  });

  // Store payment record
  await storage.createPayment({
    userId,
    razorpayPaymentId: order.id,
    amount: package_.price,
    credits: package_.credits,
    status: "pending",
  });

  return {
    orderId: order.id,
    amount: package_.price,
    currency: "INR",
    key: process.env.RAZORPAY_KEY_ID || "rzp_test_eJzAWpZFW6jUMp",
  };
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "QXAErvPE9Q6zw0560UYJEOVQ")
    .update(body.toString())
    .digest("hex");

  return expectedSignature === signature;
}

export async function processSuccessfulPayment(
  paymentId: string,
  orderId: string,
  signature: string
): Promise<void> {
  // Verify signature
  if (!verifyPaymentSignature(orderId, paymentId, signature)) {
    throw new Error("Invalid payment signature");
  }

  // Get payment details from Razorpay
  const payment = await razorpay.payments.fetch(paymentId);
  const order = await razorpay.orders.fetch(orderId);

  if (payment.status === "captured" && order.status === "paid") {
    const notes = order.notes as Record<string, string> | undefined;
    const userId = parseInt(notes?.userId || '0');
    const credits = parseInt(notes?.credits || '0');

    // Update user credits
    const user = await storage.getUser(userId);
    if (user) {
      await storage.updateUserCredits(userId, user.credits + credits);
    }

    // Update payment status
    await storage.updatePaymentStatus(paymentId, "completed");
  } else {
    throw new Error("Payment not successful");
  }
}

export async function checkUsageLimit(userId: number, featureName: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  if (!user) return false;

  // Block if user has 0 credits
  if (user.credits <= 0) {
    return false;
  }

  return true;
}

export async function deductCreditForUsage(userId: number, featureName: string): Promise<void> {
  const user = await storage.getUser(userId);
  if (!user) throw new Error("User not found");

  // Always deduct 1 credit per usage
  if (user.credits > 0) {
    await storage.updateUserCredits(userId, user.credits - 1);
  } else {
    throw new Error("Insufficient credits");
  }

  // Increment usage count for tracking
  await storage.incrementUsage(userId, featureName);
}
