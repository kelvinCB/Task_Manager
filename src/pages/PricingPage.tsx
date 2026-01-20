import React from 'react';
import { Pricing, Plan } from '../components/blocks/pricing';
import { useTheme } from '../contexts/ThemeContext';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const demoPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: { monthly: 0, yearly: 0 },
    features: [
      'Up to 10 projects',
      'Basic analytics',
      '48-hour support response time',
      'Limited API access',
      'Community support'
    ],
    recommended: false
  },
  {
    id: 'pro',
    name: 'Professional',
    price: { monthly: 99, yearly: 990 },
    features: [
      'Unlimited projects',
      'Advanced analytics',
      '24-hour support response time',
      'Full API access',
      'Priority support',
      'Team collaboration',
      'Custom integrations'
    ],
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: { monthly: 299, yearly: 2990 },
    features: [
      'Everything in Professional',
      'Custom solutions',
      'Dedicated account manager',
      '1-hour support response time',
      'SSO Authentication',
      'Advanced security',
      'Custom contracts',
      'SLA agreement'
    ],
    recommended: false
  }
];

const PricingPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handlePlanSelect = (planId: string, interval: 'monthly' | 'yearly') => {
    console.log(`Selected plan: ${planId}, interval: ${interval}`);
    // Here you would integrate with a payment provider like Stripe
    alert(`You selected the ${planId} plan (${interval}). Integration coming soon!`);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="p-4 sm:p-6 lg:p-8">
        <button 
          onClick={() => navigate(-1)}
          className={`flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
          Back
        </button>
        
        <Pricing 
          plans={demoPlans} 
          title="Upgrade your productivity" 
          description="Unlock your full potential with our Pro plan."
          onPlanSelect={handlePlanSelect}
        />
      </div>
    </div>
  );
};

export default PricingPage;
