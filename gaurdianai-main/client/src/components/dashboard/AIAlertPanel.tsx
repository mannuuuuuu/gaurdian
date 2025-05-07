import { useQuery } from "@tanstack/react-query";
import { getActiveAlerts } from "@/lib/blockchain";
import { formatSeverity } from "@/lib/groq";
import { Button } from "@/components/ui/button";
import { Alert } from "@shared/schema";

interface AIAlertPanelProps {
  fullSize?: boolean;
}

const AIAlertPanel = ({ fullSize = false }: AIAlertPanelProps) => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/alerts/active'],
    queryFn: getActiveAlerts
  });

  return (
    <div className="bg-slate-800 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:border-gray-600">
      <div className="border-b border-gray-700 px-4 py-3 flex justify-between items-center bg-slate-800/50">
        <h2 className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          AI Security Analysis
        </h2>
        <button className="text-xs bg-primary/10 text-primary hover:text-primary-light px-2 py-1 rounded-md transition-colors duration-200">
          View All
        </button>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.slice(0, fullSize ? alerts.length : 3).map((alert: Alert) => {
              const severity = formatSeverity(alert.severity);
              
              return (
                <div 
                  key={alert.id} 
                  className={`${severity.bgColor} border ${severity.borderColor} rounded-md p-3 hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-start">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      alert.severity === 'HIGH' ? 'bg-alert/20' : 
                      alert.severity === 'MEDIUM' ? 'bg-amber-900/20' : 
                      'bg-blue-900/20'
                    } mr-3 flex-shrink-0`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${severity.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className={`${severity.color} font-medium text-sm`}>{alert.title}</h3>
                        <span className={`text-xs ${severity.color} px-2 py-0.5 rounded-full ${
                          alert.severity === 'HIGH' ? 'bg-alert/20' : 
                          alert.severity === 'MEDIUM' ? 'bg-amber-900/20' : 
                          'bg-blue-900/20'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                        {alert.description.length > (fullSize ? 300 : 150)
                          ? `${alert.description.substring(0, fullSize ? 300 : 150)}...` 
                          : alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {/* Format date to readable format */}
                      {new Date(alert.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })} {new Date(alert.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <Button 
                      variant="outline"
                      className={`text-xs ${severity.color} border-${severity.color}/30 hover:bg-${alert.severity === 'HIGH' ? 'alert' : alert.severity === 'MEDIUM' ? 'amber-900' : 'blue-900'}/20 px-3 py-1`}
                    >
                      {alert.severity === 'HIGH' ? 'Review Now' : 'Investigate'}
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {/* Add recommendation item if less than 3 alerts and not on full size view */}
            {alerts.length < 3 && !fullSize && (
              <div className="bg-primary-dark/10 border border-primary-dark/30 rounded-md p-3 hover:shadow-md transition-all duration-200">
                <div className="flex items-start">
                  <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-primary-light font-medium text-sm">AI Recommendation</h3>
                      <span className="text-xs text-primary-light px-2 py-0.5 rounded-full bg-primary/10">
                        TIP
                      </span>
                    </div>
                    <p className="text-gray-300 text-xs mt-2 leading-relaxed">
                      Consider implementing a time-delay mechanism for sensitive Guardian DAO operations to allow for proper review before execution.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">No active alerts</p>
            <p className="text-xs mt-1 text-gray-400">All monitored contracts appear to be secure</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAlertPanel;
