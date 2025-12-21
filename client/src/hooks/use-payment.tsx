import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export function usePayment() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPaymentOrder = useMutation({
    mutationFn: async (packageId: string): Promise<PaymentOrderResponse> => {
      const response = await apiRequest("POST", "/api/payment/create-order", { packageId });
      return response.json();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create payment order",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyPayment = useMutation({
    mutationFn: async (data: PaymentVerificationData) => {
      const response = await apiRequest("POST", "/api/payment/verify", data);
      return response.json();
    },
    onSuccess: () => {
      // Refresh user data to get updated credits
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/usage"] });
    },
    onError: (error: any) => {
      toast({
        title: "Payment verification failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    createPaymentOrder,
    verifyPayment,
  };
}
