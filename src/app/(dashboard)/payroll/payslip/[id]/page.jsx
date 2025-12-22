import PayslipView from '@/components/payroll/payslip-view';

export default function PayslipViewPage({ params }) {
  return <PayslipView payslipId={params.id} />;
}