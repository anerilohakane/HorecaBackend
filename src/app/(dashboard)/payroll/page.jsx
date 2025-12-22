import Link from 'next/link';
import { Users, FileText, Calculator, BarChart3 } from 'lucide-react';

export default function PayrollPage() {
  const features = [
    {
      title: 'Employee Management',
      description: 'Add, edit, and manage employee details and salary information',
      icon: Users,
      href: '/payroll/employees',
      color: 'text-blue-600'
    },
    {
      title: 'Payslip Generation',
      description: 'Generate and manage employee payslips',
      icon: FileText,
      href: '/dashboard/payroll',
      color: 'text-green-600',
      disabled: true
    },
    {
      title: 'Tax Calculations',
      description: 'Calculate TDS, PF, and other deductions',
      icon: Calculator,
      href: '/dashboard/payroll',
      color: 'text-yellow-600',
      disabled: true
    },
    {
      title: 'Compliance Reporting',
      description: 'Generate compliance reports for regulatory requirements',
      icon: BarChart3,
      href: '/dashboard/payroll',
      color: 'text-purple-600',
      disabled: true
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll Management</h1>
        <p className="text-gray-600">Manage employee payroll, taxes, and compliance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Link 
            key={index} 
            href={feature.disabled ? '#' : feature.href}
            className={feature.disabled ? 'cursor-not-allowed' : ''}
          >
            <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow ${feature.disabled ? 'opacity-50' : ''}`}>
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-full bg-gray-100`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-600 mt-1">{feature.description}</p>
                  {feature.disabled && (
                    <span className="inline-block mt-2 text-sm text-orange-600">
                      Coming soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}