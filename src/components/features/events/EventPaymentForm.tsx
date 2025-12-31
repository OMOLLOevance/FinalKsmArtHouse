import React, { useState } from 'react';

interface EventPayment {
  category: string;
  quantity: number;
  unitPrice: number;
  eventBudget: number;
  amountPaid: number;
  paymentMethod: 'Cash' | 'M-Pesa' | 'Bank Transfer';
  eventLocation: string;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
}

export const EventPaymentForm: React.FC = () => {
  const [payment, setPayment] = useState<EventPayment>({
    category: '',
    quantity: 1,
    unitPrice: 0,
    eventBudget: 0,
    amountPaid: 0,
    paymentMethod: 'Cash',
    eventLocation: '',
    paymentStatus: 'Pending'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Payment data:', payment);
    // Add your save logic here
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Event Payment Details</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            value={payment.category}
            onChange={(e) => setPayment({...payment, category: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            value={payment.quantity}
            onChange={(e) => setPayment({...payment, quantity: Number(e.target.value)})}
            className="w-full p-2 border rounded"
            min="1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Unit Price (KSH)</label>
          <input
            type="number"
            value={payment.unitPrice}
            onChange={(e) => setPayment({...payment, unitPrice: Number(e.target.value)})}
            className="w-full p-2 border rounded"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Event Budget (KSH)</label>
          <input
            type="number"
            value={payment.eventBudget}
            onChange={(e) => setPayment({...payment, eventBudget: Number(e.target.value)})}
            className="w-full p-2 border rounded"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount Paid (KSH)</label>
          <input
            type="number"
            value={payment.amountPaid}
            onChange={(e) => setPayment({...payment, amountPaid: Number(e.target.value)})}
            className="w-full p-2 border rounded"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Method</label>
          <select
            value={payment.paymentMethod}
            onChange={(e) => setPayment({...payment, paymentMethod: e.target.value as any})}
            className="w-full p-2 border rounded"
          >
            <option value="Cash">Cash</option>
            <option value="M-Pesa">M-Pesa</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Event Location</label>
          <input
            type="text"
            value={payment.eventLocation}
            onChange={(e) => setPayment({...payment, eventLocation: e.target.value})}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Payment Status</label>
          <select
            value={payment.paymentStatus}
            onChange={(e) => setPayment({...payment, paymentStatus: e.target.value as any})}
            className="w-full p-2 border rounded"
          >
            <option value="Pending">Pending</option>
            <option value="Partial">Partial</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
      >
        Save Payment Details
      </button>
    </form>
  );
};