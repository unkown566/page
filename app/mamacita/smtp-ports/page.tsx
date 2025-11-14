'use client'

import AdminLayout from '@/components/admin/AdminLayout'

export default function SMTPPortsPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SMTP Port Reference</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Port Overview</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Port 587 (STARTTLS) - Modern Standard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Recommended for most providers. Uses STARTTLS for encryption.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Providers: Office365, Gmail, iCloud, Kagoya, Value-Domain, Heteml
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Port 465 (SSL/TLS) - Legacy but Common</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Older standard, still widely used. Implicit TLS/SSL.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Providers: Zoho, Yahoo, Biglobe, OCN, Nifty, Plala, Sakura, Xserver, Lolipop, Muumuu
              </p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Port 25 - Legacy (Deprecated)</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Original SMTP port. Mostly deprecated for client submission.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Only supported by: Gmail (legacy)
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Provider</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Primary Port</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Alternative Ports</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Security</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Office 365</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS / SSL</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Gmail</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">465, 25</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS / SSL</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Zoho</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / TLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Yahoo</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Biglobe</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Sakura</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Muumuu</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">-</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL only</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">iCloud</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">-</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS only</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Outlook</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">-</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS only</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">FastMail</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">AOL</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">OCN</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Nifty</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Plala</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Yahoo Japan</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Rakuten</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">So-net</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">-</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS only</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Kagoya</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS / SSL</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Value-Domain</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS / SSL</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Heteml</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">STARTTLS / SSL</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Lolipop</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Xserver</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">ConoHa</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600 dark:text-blue-400">465</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">587</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">SSL / STARTTLS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}




