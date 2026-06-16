"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  clientSecret: string;
  onClose: () => void;
}

export default function StripeCheckoutModal({ clientSecret, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const options = useCallback(() => Promise.resolve(clientSecret), [clientSecret]);

  if (!mounted) return null;

  return (
    <div className="sc-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sc-modal">
        <button className="sc-close" onClick={onClose} aria-label="Close">×</button>
        <div className="sc-body">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret: options }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
