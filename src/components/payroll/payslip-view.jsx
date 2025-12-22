"use client"
import { useState, useEffect } from 'react';
import {
  Download, ArrowLeft, Printer, FileText, Calendar,
  User, CreditCard, Building, IndianRupee, CheckCircle,
  Clock, AlertCircle, Mail, Phone, MapPin, Bank,
  IdCard, Percent, Receipt, Shield, Calculator, Loader2
} from 'lucide-react';

// You'll need to install these packages:
// npm install jspdf html2canvas
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PayslipView({ payslipId }) {
  const [payslip, setPayslip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (payslipId) {
      fetchPayslip();
    }
  }, [payslipId]);

 const fetchPayslip = async () => {
  try {
    setLoading(true);
    const response = await fetch(`/api/payroll/payslip/${payslipId}`);
    
    if (response.ok) {
      const payslipData = await response.json();

      // --- FRONTEND FIX STARTS HERE ---
      const basic = payslipData.basicSalary || 0;

      const earningsTotal =
        (payslipData.earnings?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0);

      const overtimeTotal = payslipData.overtimeAmount || 0;

      const deductionsTotal =
        (payslipData.deductions?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0);

      payslipData.grossSalary = basic + earningsTotal + overtimeTotal;
      payslipData.totalDeductions = deductionsTotal;
      payslipData.netSalary = payslipData.grossSalary - deductionsTotal;
      // --- FRONTEND FIX ENDS HERE ---

      setPayslip(payslipData);
    } else {
      console.error('Failed to fetch payslip:', await response.json());
      alert('Failed to load payslip data');
    }
  } catch (error) {
    console.error('Error fetching payslip:', error);
    alert('Error loading payslip data');
  } finally {
    setLoading(false);
  }
};

  console.log(payslip)
  const generatePDFContent = () => {
    if (!payslip) return '';

    const totalEarnings =
  (payslip.basicSalary || 0) +
  (payslip.earnings?.reduce((sum, earning) => sum + (earning.amount || 0), 0) || 0);


    const totalDeductions = payslip.deductions?.reduce((sum, deduction) => sum + (deduction.amount || 0), 0) || 0;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payslip - ${payslip.payslipId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            background: #ffffff;
          }
          
          .pdf-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          
          .header {
            border-bottom: 3px solid #eab308;
            padding-bottom: 30px;
            margin-bottom: 30px;
          }
          
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
          }
          
          .company-info h1 {
            font-size: 28px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 5px;
          }
          
          .company-info p {
            color: #64748b;
            font-size: 14px;
          }
          
          .payslip-title {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #fbbf24;
            margin-top: 15px;
          }
          
          .payslip-title h2 {
            font-size: 18px;
            font-weight: 600;
            color: #92400e;
          }
          
          .document-info {
            text-align: right;
          }
          
          .document-info p {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 5px;
          }
          
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background: #dcfce7;
            color: #166534;
            border: 1px solid #bbf7d0;
          }
          
          .section {
            margin-bottom: 30px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #f1f5f9;
            display: flex;
            align-items: center;
          }
          
          .section-icon {
            width: 20px;
            height: 20px;
            background: #fef3c7;
            border-radius: 4px;
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 20px;
          }
          
          .info-group {
            margin-bottom: 20px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          
          .info-row:last-child {
            border-bottom: none;
          }
          
          .info-label {
            color: #64748b;
            font-size: 14px;
            flex: 1;
          }
          
          .info-value {
            color: #1e293b;
            font-weight: 500;
            font-size: 14px;
            text-align: right;
            flex: 1;
          }
          
          .earnings-section {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 20px;
          }
          
          .deductions-section {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
          }
          
          .section-header {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 15px;
            color: #166534;
          }
          
          .deductions-section .section-header {
            color: #dc2626;
          }
          
          .amount-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          
          .total-row {
            border-top: 2px solid #16a34a;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: 600;
            font-size: 15px;
            color: #166534;
          }
          
          .deductions-section .total-row {
            border-top-color: #dc2626;
            color: #dc2626;
          }
          
          .net-salary {
            background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
            border: 2px solid #fbbf24;
            border-radius: 12px;
            padding: 25px;
            text-align: center;
            margin: 30px 0;
          }
          
          .net-salary h3 {
            font-size: 20px;
            color: #92400e;
            margin-bottom: 10px;
          }
          
          .net-amount {
            font-size: 36px;
            font-weight: bold;
            color: #92400e;
            margin-bottom: 10px;
          }
          
          .amount-words {
            font-size: 12px;
            color: #a16207;
            font-style: italic;
          }
          
          .attendance-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
          }
          
          .attendance-card {
            text-align: center;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          
          .attendance-card.working-days {
            background: #eff6ff;
            border-color: #bfdbfe;
          }
          
          .attendance-card.present-days {
            background: #f0fdf4;
            border-color: #bbf7d0;
          }
          
          .attendance-card.leave-days {
            background: #fefbeb;
            border-color: #fde68a;
          }
          
          .attendance-card.overtime {
            background: #faf5ff;
            border-color: #e9d5ff;
          }
          
          .attendance-number {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .working-days .attendance-number { color: #1d4ed8; }
          .present-days .attendance-number { color: #16a34a; }
          .leave-days .attendance-number { color: #d97706; }
          .overtime .attendance-number { color: #7c3aed; }
          
          .attendance-label {
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid #f1f5f9;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          
          .notes {
            flex: 1;
            margin-right: 40px;
          }
          
          .notes h4 {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 10px;
            color: #1e293b;
          }
          
          .notes-content {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
          }
          
          .signature {
            text-align: center;
            min-width: 150px;
          }
          
          .signature-line {
            border-bottom: 2px solid #64748b;
            height: 60px;
            margin-bottom: 10px;
          }
          
          .signature-title {
            font-size: 12px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 3px;
          }
          
          .signature-dept {
            font-size: 10px;
            color: #64748b;
          }
          
          @media print {
            .pdf-container {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <!-- Header -->
          <div class="header">
            <div class="company-header">
              <div class="company-info">
                <h1>SupplyChainPro</h1>
                <p>Business Management Suite</p>
                <div class="payslip-title">
                  <h2>Pay Slip for the month of ${getMonthName(payslip.month)} ${payslip.year}</h2>
                </div>
              </div>
              <div class="document-info">
                <p><strong>Payslip ID:</strong> ${payslip.payslipId}</p>
                <p><strong>Generated on:</strong> ${formatDate(payslip.createdAt)}</p>
                <span class="status-badge">${payslip.status}</span>
              </div>
            </div>
          </div>

          <!-- Employee Information -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">👤</span>
              Employee & Payment Information
            </h3>
            <div class="two-column">
              <div class="info-group">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">Employee Details</h4>
                <div class="info-row">
                  <span class="info-label">Name:</span>
                  <span class="info-value">${payslip.employee?.personalDetails?.firstName} ${payslip.employee?.personalDetails?.lastName}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Employee ID:</span>
                  <span class="info-value">${payslip.employee?.employeeId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${payslip.employee?.personalDetails?.email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Phone:</span>
                  <span class="info-value">${payslip.employee?.personalDetails?.phone}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Department:</span>
                  <span class="info-value">${payslip.employee?.jobDetails?.department} - ${payslip.employee?.jobDetails?.designation}</span>
                </div>
              </div>
              <div class="info-group">
                <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #1e293b;">Payment Details</h4>
                <div class="info-row">
                  <span class="info-label">Payment Month:</span>
                  <span class="info-value">${getMonthName(payslip.month)} ${payslip.year}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Payment Method:</span>
                  <span class="info-value">${payslip.paymentMethod || 'Bank Transfer'}</span>
                </div>
                ${payslip.paymentDate ? `
                <div class="info-row">
                  <span class="info-label">Payment Date:</span>
                  <span class="info-value">${formatDate(payslip.paymentDate)}</span>
                </div>
                ` : ''}
                <div class="info-row">
                  <span class="info-label">Bank:</span>
                  <span class="info-value">${payslip.employee?.salaryDetails?.bankAccount?.bankName || 'N/A'}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Account:</span>
                  <span class="info-value">••••${payslip.employee?.salaryDetails?.bankAccount?.accountNumber?.slice(-4) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Salary Breakdown -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">💰</span>
              Salary Breakdown
            </h3>
            <div class="two-column">
              <div class="earnings-section">
                <div class="section-header">Earnings</div>
                <div class="amount-row">
                  <span>Basic Salary</span>
                  <span>${formatCurrency(payslip.basicSalary)}</span>
                </div>
                ${payslip.earnings?.map(earning => `
                  <div class="amount-row">
                    <span>${earning.type}</span>
                    <span>${formatCurrency(earning.amount)}</span>
                  </div>
                `).join('') || ''}
                ${payslip.overtimeAmount > 0 ? `
                  <div class="amount-row">
                    <span>Overtime (${payslip.overtimeHours} hours)</span>
                    <span>${formatCurrency(payslip.overtimeAmount)}</span>
                  </div>
                ` : ''}
                <div class="amount-row total-row">
                  <span><strong>Total Earnings</strong></span>
                  <span><strong>${formatCurrency(totalEarnings + (payslip.overtimeAmount || 0))}</strong></span>
                </div>
              </div>
              
              <div class="deductions-section">
                <div class="section-header">Deductions</div>
                ${payslip.deductions?.map(deduction => `
                  <div class="amount-row">
                    <span>${deduction.type}</span>
                    <span>-${formatCurrency(deduction.amount)}</span>
                  </div>
                `).join('') || '<div class="amount-row"><span>No deductions</span><span>₹0</span></div>'}
                <div class="amount-row total-row">
                  <span><strong>Total Deductions</strong></span>
                  <span><strong>-${formatCurrency(totalDeductions)}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <!-- Net Salary -->
          <div class="net-salary">
            <h3>Net Salary Payable</h3>
            <div class="net-amount">${formatCurrency(payslip.netSalary)}</div>
            <div class="amount-words">${amountToWords(payslip.netSalary)}</div>
          </div>

          <!-- Attendance Summary -->
          <div class="section">
            <h3 class="section-title">
              <span class="section-icon">📅</span>
              Attendance Summary
            </h3>
            <div class="attendance-grid">
              <div class="attendance-card working-days">
                <div class="attendance-number">${payslip.workingDays}</div>
                <div class="attendance-label">Working Days</div>
              </div>
              <div class="attendance-card present-days">
                <div class="attendance-number">${payslip.presentDays}</div>
                <div class="attendance-label">Present Days</div>
              </div>
              <div class="attendance-card leave-days">
                <div class="attendance-number">${payslip.leaveDays || 0}</div>
                <div class="attendance-label">Leave Days</div>
              </div>
              <div class="attendance-card overtime">
                <div class="attendance-number">${payslip.overtimeHours || 0}</div>
                <div class="attendance-label">Overtime Hours</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="notes">
              <h4>Notes</h4>
              <div class="notes-content">
                ${payslip.notes || 'This is a computer-generated payslip and does not require signature.'}
              </div>
            </div>
            <div class="signature">
              <div class="signature-line"></div>
              <div class="signature-title">Authorized Signatory</div>
              <div class="signature-dept">SupplyChainPro HR Department</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    if (!payslip) return;
    
    setGeneratingPdf(true);
    try {
      // Create a temporary iframe to render the PDF content
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '1200px';
      document.body.appendChild(iframe);

      // Write the HTML content to the iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(generatePDFContent());
      iframeDoc.close();

      // Wait for content to load
      await new Promise(resolve => {
        iframe.onload = resolve;
        // Fallback timeout
        setTimeout(resolve, 1000);
      });

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: iframeDoc.body.scrollHeight
      });

      // Clean up iframe
      document.body.removeChild(iframe);

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Top margin

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - 20; // Account for margins

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - 20;
      }

      // Download the PDF
      const fileName = `payslip-${payslip.payslipId}-${getMonthName(payslip.month)}-${payslip.year}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    // Create a new window with the payslip content for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(generatePDFContent());
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthNumber - 1] || '';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      Draft: { color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Clock },
      Generated: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
      Approved: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle },
      Paid: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CreditCard },
      Failed: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
    };
    
    const { color, icon: Icon } = statusConfig[status] || statusConfig.Generated;
    
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium border ${color}`}>
        <Icon className="w-4 h-4" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
          <span className="text-slate-600 font-medium">Loading payslip...</span>
        </div>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Payslip Not Found</h2>
          <p className="text-slate-600 mb-6">The requested payslip could not be found.</p>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Payslips
          </button>
        </div>
      </div>
    );
  }
  console.log("payslp = ",payslip.employee)
 const totalEarnings =
  (payslip.basicSalary || 0) +
  (payslip.earnings?.reduce((sum, earning) => sum + (earning.amount || 0), 0) || 0);

  const totalDeductions = payslip.deductions?.reduce((sum, deduction) => sum + (deduction.amount || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.history.back()}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Receipt className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">Payslip</h1>
                  <p className="text-slate-600">{payslip.payslipId}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleDownloadPDF}
                disabled={generatingPdf}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors font-medium"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Rest of your existing JSX remains the same... */}
        {/* Payslip Document */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none">
          {/* Document Header */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">SupplyChainPro</h2>
                <p className="text-slate-600">Business Management Suite</p>
                <p className="text-slate-600 font-medium mt-2">
                  Pay Slip for the month of {getMonthName(payslip.month)} {payslip.year}
                </p>
              </div>
              <div className="text-right">
                <div className="space-y-2">
                  <p className="text-sm text-slate-600">Payslip ID: <span className="font-medium">{payslip.payslipId}</span></p>
                  <p className="text-sm text-slate-600">Generated on: <span className="font-medium">{formatDate(payslip.createdAt)}</span></p>
                  {getStatusBadge(payslip.status)}
                </div>
              </div>
            </div>
          </div>

          {/* Employee Information */}
          <div className="p-6 border-b border-slate-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  Employee Information
                </h3>
                {payslip.employee && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-900 font-medium">
                        {payslip.employee.personalDetails?.firstName} {payslip.employee.personalDetails?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <IdCard className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">ID: {payslip.employee.employeeId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{payslip.employee.personalDetails?.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{payslip.employee.personalDetails?.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        {payslip.employee.jobDetails?.department} - {payslip.employee.jobDetails?.designation}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-3 h-3 text-green-600" />
                  </div>
                  Payment Information
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Payment Month: {getMonthName(payslip.month)} {payslip.year}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Payment Method: {payslip.paymentMethod || 'Bank Transfer'}</span>
                  </div>
                  {payslip.paymentDate && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Payment Date: {formatDate(payslip.paymentDate)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {/* <Bank className="w-4 h-4 text-slate-400" /> */}
                    <span className="text-slate-600">Bank: {payslip.employee?.salaryDetails?.bankAccount?.bankName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <IdCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">
                      Account: ••••{payslip.employee?.salaryDetails?.bankAccount?.accountNumber?.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Breakdown */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calculator className="w-3 h-3 text-yellow-600" />
              </div>
              Salary Breakdown
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Earnings */}
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-200 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-3 h-3 text-green-700" />
                  </div>
                  Earnings
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700">Basic Salary</span>
                    <span className="font-medium text-slate-900">{formatCurrency(payslip.basicSalary)}</span>
                  </div>
                  
                  {payslip.earnings?.map((earning, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-700">{earning.type}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(earning.amount)}</span>
                    </div>
                  ))}
                  
                  {payslip.overtimeAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-700">Overtime ({payslip.overtimeHours} hours)</span>
                      <span className="font-medium text-green-700">{formatCurrency(payslip.overtimeAmount)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-green-300 pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-green-800">Total Earnings</span>
                      <span className="font-bold text-green-800 text-lg">
                        {formatCurrency(totalEarnings + (payslip.overtimeAmount || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-200 rounded-lg flex items-center justify-center">
                    <IndianRupee className="w-3 h-3 text-red-700" />
                  </div>
                  Deductions
                </h4>
                <div className="space-y-3">
                  {payslip.deductions?.map((deduction, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-slate-700">{deduction.type}</span>
                      <span className="font-medium text-red-700">-{formatCurrency(deduction.amount)}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-red-300 pt-3 mt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-red-800">Total Deductions</span>
                      <span className="font-bold text-red-800 text-lg">-{formatCurrency(totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary */}
          <div className="p-6 border-b border-slate-200">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xl font-bold text-slate-900 mb-2">Net Salary Payable</h4>
                  <p className="text-slate-600">Amount transferred to bank account</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-700">{formatCurrency(payslip.netSalary)}</p>
                  <p className="text-sm text-slate-600 mt-1 max-w-xs">
                    <span className="font-medium">In words:</span> {amountToWords(payslip.netSalary)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-3 h-3 text-purple-600" />
              </div>
              Attendance Summary
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm text-blue-600 mb-1">Working Days</p>
                <p className="text-2xl font-bold text-blue-800">{payslip.workingDays}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-sm text-green-600 mb-1">Present Days</p>
                <p className="text-2xl font-bold text-green-800">{payslip.presentDays}</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </div>
                <p className="text-sm text-yellow-600 mb-1">Leave Days</p>
                <p className="text-2xl font-bold text-yellow-800">{payslip.leaveDays || 0}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-sm text-purple-600 mb-1">Overtime Hours</p>
                <p className="text-2xl font-bold text-purple-800">{payslip.overtimeHours || 0}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Notes</h4>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-sm text-slate-600">
                    {payslip.notes || 'This is a computer-generated payslip and does not require signature.'}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="text-center">
                  <div className="w-32 h-16 border-b-2 border-slate-300 mb-3"></div>
                  <p className="text-sm font-semibold text-slate-900">Authorized Signatory</p>
                  <p className="text-xs text-slate-500">SupplyChainPro HR Department</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {/* <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-8">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <p className="text-slate-600 text-sm mt-1">Common actions for this payslip</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={handleDownloadPDF} 
                disabled={generatingPdf}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                  {generatingPdf ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : (
                    <Download className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <span className="font-medium text-slate-900">
                  {generatingPdf ? 'Generating PDF...' : 'Download PDF'}
                </span>
                <span className="text-sm text-slate-600 mt-1">Save payslip as PDF</span>
              </button>
              
              <button 
                onClick={handlePrint}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all group"
              >
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                  <Printer className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-medium text-slate-900">Print Payslip</span>
                <span className="text-sm text-slate-600 mt-1">Print physical copy</span>
              </button>
              
              <button 
                onClick={() => window.history.back()}
                className="flex flex-col items-center justify-center p-6 border-2 border-slate-200 rounded-xl hover:border-yellow-300 hover:bg-yellow-50 transition-all group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                  <ArrowLeft className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-medium text-slate-900">Back to Payslips</span>
                <span className="text-sm text-slate-600 mt-1">Return to payslip list</span>
              </button>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}

// Helper function to convert amount to words
function amountToWords(amount) {
  if (amount === 0) return 'Zero Rupees';
  
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', 'Ten', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanOneThousand(number) {
    let result = '';
    
    if (number >= 100) {
      result += units[Math.floor(number / 100)] + ' Hundred ';
      number %= 100;
    }
    
    if (number >= 20) {
      result += tens[Math.floor(number / 10)] + ' ';
      number %= 10;
    } else if (number >= 10) {
      result += teens[number - 10] + ' ';
      number = 0;
    }
    
    if (number > 0) {
      result += units[number] + ' ';
    }
    
    return result.trim();
  }
  
  let words = '';
  let num = Math.floor(amount);
  
  if (num >= 10000000) {
    words += convertLessThanOneThousand(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  
  if (num >= 100000) {
    words += convertLessThanOneThousand(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  
  if (num >= 1000) {
    words += convertLessThanOneThousand(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  
  if (num > 0) {
    words += convertLessThanOneThousand(num);
  }
  
  words = words.trim() + ' Rupees';
  
  // Add paise if needed
  const paise = Math.round((amount - Math.floor(amount)) * 100);
  if (paise > 0) {
    words += ' and ' + convertLessThanOneThousand(paise) + ' Paise';
  }
  
  return words;
}