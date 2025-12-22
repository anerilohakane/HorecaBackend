import EmployeeEdit from '@/components/payroll/employee-edit';

export default function EmployeeEditPage({ params }) {
  return <EmployeeEdit employeeId={params.id} />;
}