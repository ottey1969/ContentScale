import React from 'react';
import { X, CreditCard, Check } from 'lucide-react';

interface PaymentPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPayment: () => void;
}

export default function PaymentPopup({ isOpen, onClose, onPayment }: PaymentPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Complete Payment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Credit System Explanation */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-4 mb-6 text-white">
          <h3 className="font-bold mb-2">💳 Credit System</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>1 Credit =</span>
              <span className="font-bold">$2.00</span>
            </div>
            <div className="border-t border-white/20 pt-2">
              <div className="text-xs opacity-90">What you can create with 1 credit:</div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <div className="flex items-center space-x-1">
                  <Check size={12} />
                  <span className="text-xs">1 Blog Post</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check size={12} />
                  <span className="text-xs">1 Article</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check size={12} />
                  <span className="text-xs">1 Email</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Check size={12} />
                  <span className="text-xs">Product Description</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Free Content Notice */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
          <div className="text-green-800 dark:text-green-200 text-sm">
            <strong>✅ First content FREE!</strong><br />
            You've used your free content. Additional content requires credits.
          </div>
        </div>

        {/* Pricing */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">Choose Your Credits</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">1 Credit</span>
                <div className="text-xs text-gray-600 dark:text-gray-400">For this content</div>
              </div>
              <span className="font-bold text-blue-600 dark:text-blue-400">$2.00</span>
            </div>
            
            <div className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">5 Credits</span>
                <div className="text-xs text-green-600 dark:text-green-400">Save 10% • $1.80 each</div>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">$9.00</span>
            </div>
            
            <div className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">10 Credits</span>
                <div className="text-xs text-green-600 dark:text-green-400">Save 25% • $1.50 each</div>
              </div>
              <span className="font-bold text-gray-900 dark:text-white">$15.00</span>
            </div>
          </div>
        </div>

        {/* PayPal Button */}
        <button
          onClick={onPayment}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <CreditCard size={20} />
          <span>Pay with PayPal - $2.00</span>
        </button>

        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
          Secure payment processed by PayPal. No card details stored.
        </div>
      </div>
    </div>
  );
}