import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { usePayment } from "@/hooks/use-payment";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, ArrowLeft, CreditCard, Shield, Zap } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const creditPackages = {
  starter: {
    id: "starter",
    name: "Starter Pack",
    credits: 5,
    price: 99,
    popular: true,
    features: [
      "5 feature uses",
      "Advanced API templates",
      "CI/CD workflow generation",
      "AI DevOps assistance",
      "Priority support"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro Pack",
    credits: 10,
    price: 149,
    popular: false,
    features: [
      "10 feature uses",
      "Everything in Starter",
      "Terraform generation",
      "Helm charts",
      "Custom templates"
    ]
  }
};

export default function Checkout() {
  const { packageId } = useParams<{ packageId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { createPaymentOrder, verifyPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const selectedPackage = packageId ? creditPackages[packageId as keyof typeof creditPackages] : null;

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!selectedPackage || !user) return;

    try {
      setIsProcessing(true);

      const orderData = await createPaymentOrder.mutateAsync(selectedPackage.id);

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'DevOpsCloud',
        description: `${selectedPackage.name} - ${selectedPackage.credits} credits`,
        order_id: orderData.orderId,
        prefill: {
          name: user.username,
          email: user.email,
        },
        theme: {
          color: '#00D9FF'
        },
        handler: async function (response: any) {
          try {
            await verifyPayment.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast({
              title: "Payment Successful!",
              description: `${selectedPackage.credits} credits have been added to your account.`,
            });

            setLocation("/dashboard");
          } catch (error) {
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if the amount was deducted.",
              variant: "destructive",
            });
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (!selectedPackage) {
    return (
      <div className="min-h-screen bg-dark-bg">
        <Navigation />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <Card className="bg-dark-card border-gray-800">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold text-white mb-4">Package Not Found</h2>
              <p className="text-gray-400 mb-4">The selected package could not be found.</p>
              <Button onClick={() => setLocation("/dashboard")} className="bg-neon-cyan text-dark-bg">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navigation />
      
      <div className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              onClick={() => setLocation("/dashboard")}
              variant="ghost"
              className="text-gray-400 hover:text-white mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <h1 className="text-3xl font-bold text-white mb-2">Complete Your Purchase</h1>
            <p className="text-gray-400">Secure payment powered by Razorpay</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Package Details */}
            <div className="space-y-6">
              <Card className={`bg-dark-card border-gray-800 ${selectedPackage.popular ? 'ring-2 ring-neon-cyan' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{selectedPackage.name}</CardTitle>
                    {selectedPackage.popular && (
                      <Badge className="bg-neon-cyan text-dark-bg">Most Popular</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">₹{selectedPackage.price}</div>
                    <p className="text-gray-400">{selectedPackage.credits} credits included</p>
                  </div>

                  <ul className="space-y-3">
                    {selectedPackage.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <Check className="w-5 h-5 text-neon-green flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-white mb-2">What are credits?</h4>
                    <p className="text-sm text-gray-400">
                      Credits are used to access premium features like API generation, Docker tools, and AI assistance. 
                      Each feature usage costs 1 credit. Credits never expire.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-neon-green" />
                    <span>Secure Payment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span>256-bit SSL encryption</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span>PCI DSS compliant</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span>Instant credit activation</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                      <span>Money-back guarantee</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="space-y-6">
              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{selectedPackage.name}</span>
                    <span className="text-white">₹{selectedPackage.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Credits</span>
                    <span className="text-neon-cyan">{selectedPackage.credits} credits</span>
                  </div>
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-white">Total</span>
                      <span className="text-2xl text-white">₹{selectedPackage.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-dark-card border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Payment Method</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-6 h-6 text-neon-cyan" />
                      <div>
                        <p className="font-medium text-white">Razorpay Secure Checkout</p>
                        <p className="text-sm text-gray-400">Credit/Debit Card, UPI, Net Banking, Wallets</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing || createPaymentOrder.isPending || verifyPayment.isPending}
                    className="w-full bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-bg font-semibold py-3 hover:opacity-90 transition-opacity duration-200"
                  >
                    {isProcessing || createPaymentOrder.isPending ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Pay ₹{selectedPackage.price} Securely
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-400 text-center">
                    By clicking "Pay", you agree to our{" "}
                    <a href="#" className="text-neon-cyan hover:underline">Terms of Service</a>{" "}
                    and confirm that you have read our{" "}
                    <a href="#" className="text-neon-cyan hover:underline">Privacy Policy</a>.
                  </p>
                </CardContent>
              </Card>

              {/* Current Credits */}
              <Card className="bg-dark-card border-gray-800">
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-1">Current Credits</p>
                    <p className="text-2xl font-bold text-neon-cyan">{user?.credits || 0}</p>
                    <p className="text-sm text-gray-400">
                      After purchase: {(user?.credits || 0) + selectedPackage.credits} credits
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
