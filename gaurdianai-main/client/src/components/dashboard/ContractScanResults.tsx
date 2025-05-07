import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ContractScanResult, VulnerabilityFinding } from '@/lib/quillai';
import { Separator } from '@/components/ui/separator';

interface ContractScanResultsProps {
  result: ContractScanResult;
  sourceCode?: string;
}

const ContractScanResults = ({ result, sourceCode }: ContractScanResultsProps) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [expandedVulnerability, setExpandedVulnerability] = useState<string | null>(null);
  
  // Format timestamp
  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get color for severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500 shadow-glow-red';
      case 'HIGH':
        return 'bg-orange-500';
      case 'MEDIUM':
        return 'bg-yellow-500';
      case 'LOW':
        return 'bg-blue-500';
      case 'INFO':
        return 'bg-slate-500';
      default:
        return 'bg-slate-500';
    }
  };
  
  // Get text color for severity
  const getSeverityTextColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-500';
      case 'HIGH':
        return 'text-orange-500';
      case 'MEDIUM':
        return 'text-yellow-500';
      case 'LOW':
        return 'text-blue-500';
      case 'INFO':
        return 'text-slate-400';
      default:
        return 'text-slate-400';
    }
  };
  
  // Get background color for severity
  const getSeverityBgColor = (severity: string): string => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-900/20 border-red-900/30';
      case 'HIGH':
        return 'bg-orange-900/20 border-orange-900/30';
      case 'MEDIUM':
        return 'bg-yellow-900/20 border-yellow-900/30';
      case 'LOW':
        return 'bg-blue-900/20 border-blue-900/30';
      case 'INFO':
        return 'bg-slate-800 border-slate-700';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };
  
  // Get health status based on score
  const getHealthStatus = () => {
    if (result.overall_score >= 85) {
      return {
        label: 'Healthy',
        color: 'text-green-500',
        bgColor: 'bg-green-900/20',
        icon: (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        )
      };
    } else if (result.overall_score >= 70) {
      return {
        label: 'Moderate Risk',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-900/20',
        icon: (
          <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    } else if (result.overall_score >= 50) {
      return {
        label: 'High Risk',
        color: 'text-orange-500',
        bgColor: 'bg-orange-900/20',
        icon: (
          <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    } else {
      return {
        label: 'Critical Risk',
        color: 'text-red-500',
        bgColor: 'bg-red-900/20',
        icon: (
          <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      };
    }
  };
  
  // Get score color based on score value
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    if (score >= 50) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Get progress color based on score value
  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  // Calculate total findings
  const totalFindings = 
    result.vulnerability_count.critical +
    result.vulnerability_count.high +
    result.vulnerability_count.medium +
    result.vulnerability_count.low +
    result.vulnerability_count.info;
  
  // Get health status
  const healthStatus = getHealthStatus();
  
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">
            <span className="bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Quill.ai Security Scan Results
            </span>
          </h3>
          <Badge 
            className={`px-3 py-1 text-white ${healthStatus.bgColor} border`}
          >
            {healthStatus.icon}
            <span className="ml-1">{healthStatus.label}</span>
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Contract Details */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Contract Details</h4>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Address</span>
                <span className="font-mono text-secondary-light text-sm truncate">{result.contract_address}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Scan ID</span>
                <span className="text-white text-sm">{result.scan_id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Scan Timestamp</span>
                <span className="text-white text-sm">{formatDate(result.timestamp)}</span>
              </div>
            </div>
          </div>
          
          {/* Score Summary */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-gray-400 mb-3">Security Score</h4>
            <div className="flex flex-col items-center justify-center h-[calc(100%-2rem)]">
              <div className="relative w-32 h-32 mb-3">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-slate-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className={getScoreColor(result.overall_score)}
                    strokeWidth="10"
                    strokeDasharray={`${result.overall_score * 2.51} 251`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-4xl font-bold ${getScoreColor(result.overall_score)}`}>
                    {Math.round(result.overall_score)}
                  </span>
                </div>
              </div>
              <div className="text-sm text-center text-gray-400">
                {result.overall_score >= 85 && 'Contract is generally secure'}
                {result.overall_score >= 70 && result.overall_score < 85 && 'Contract needs some attention'}
                {result.overall_score >= 50 && result.overall_score < 70 && 'Multiple security issues found'}
                {result.overall_score < 50 && 'Serious security concerns detected'}
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Vulnerability Summary</h4>
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-red-900/20 text-red-500 rounded-lg px-3 py-2 text-center border border-red-900/30">
              <div className="text-xl font-bold">{result.vulnerability_count.critical}</div>
              <div className="text-xs mt-1">Critical</div>
            </div>
            <div className="bg-orange-900/20 text-orange-500 rounded-lg px-3 py-2 text-center border border-orange-900/30">
              <div className="text-xl font-bold">{result.vulnerability_count.high}</div>
              <div className="text-xs mt-1">High</div>
            </div>
            <div className="bg-yellow-900/20 text-yellow-500 rounded-lg px-3 py-2 text-center border border-yellow-900/30">
              <div className="text-xl font-bold">{result.vulnerability_count.medium}</div>
              <div className="text-xs mt-1">Medium</div>
            </div>
            <div className="bg-blue-900/20 text-blue-400 rounded-lg px-3 py-2 text-center border border-blue-900/30">
              <div className="text-xl font-bold">{result.vulnerability_count.low}</div>
              <div className="text-xs mt-1">Low</div>
            </div>
            <div className="bg-slate-800 text-slate-400 rounded-lg px-3 py-2 text-center border border-slate-700">
              <div className="text-xl font-bold">{result.vulnerability_count.info}</div>
              <div className="text-xs mt-1">Info</div>
            </div>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="overview" onValueChange={setSelectedTab} className="w-full">
        <div className="border-b border-slate-700 px-6">
          <TabsList className="bg-slate-900">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="findings">Vulnerabilities ({totalFindings})</TabsTrigger>
            <TabsTrigger value="source">Source Code</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="overview" className="p-6 space-y-6">
          {/* Audit Summary */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Audit Summary</h4>
            <div className="prose prose-sm prose-invert max-w-none text-gray-300 whitespace-pre-line">
              {result.audit_summary}
            </div>
          </div>
          
          {/* Gas Optimization Suggestions */}
          {result.gas_optimization_suggestions && result.gas_optimization_suggestions.length > 0 && (
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Gas Optimization Suggestions</h4>
              <ul className="space-y-2">
                {result.gas_optimization_suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-4 h-4 text-primary mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-sm text-gray-300">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Category Distribution */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Category Distribution</h4>
            <div className="space-y-4">
              {Object.entries(
                result.vulnerabilities.reduce((acc: Record<string, number>, curr) => {
                  acc[curr.category] = (acc[curr.category] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([category, count]) => {
                  const percentage = Math.round((count / totalFindings) * 100);
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-white">{category}</span>
                        <span className="text-gray-400">{count} ({percentage}%)</span>
                      </div>
                      <Progress className="h-2" value={percentage} />
                    </div>
                  );
                })}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="findings" className="p-4">
          <Accordion type="single" collapsible className="space-y-3">
            {result.vulnerabilities.map((vulnerability) => (
              <AccordionItem 
                key={vulnerability.id} 
                value={vulnerability.id}
                className={`${getSeverityBgColor(vulnerability.severity)} rounded-lg border p-1`}
              >
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(vulnerability.severity)} mr-3`}></div>
                      <span className="text-white font-medium text-sm">{vulnerability.name}</span>
                    </div>
                    <div className="flex items-center">
                      <Badge className={`mr-3 ${getSeverityBgColor(vulnerability.severity)} border-0`}>
                        <span className={`${getSeverityTextColor(vulnerability.severity)}`}>
                          {vulnerability.severity}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-gray-400 border-gray-600">
                        {vulnerability.category}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3 pt-1">
                  <div className="space-y-3 text-sm">
                    <div>
                      <h4 className="text-gray-400 mb-1">Description</h4>
                      <p className="text-white">{vulnerability.description}</p>
                    </div>
                    
                    {vulnerability.code_snippet && (
                      <div>
                        <h4 className="text-gray-400 mb-1">Vulnerable Code</h4>
                        <div className="bg-slate-950 p-3 rounded-md font-mono text-xs text-white overflow-x-auto whitespace-pre">
                          <div className="flex items-start">
                            <div className="text-gray-500 mr-4 select-none">
                              {vulnerability.line_number && (
                                Array.from(
                                  { length: vulnerability.code_snippet.split('\n').length },
                                  (_, i) => i + vulnerability.line_number!
                                ).map((lineNumber) => (
                                  <div key={lineNumber}>{lineNumber}</div>
                                ))
                              )}
                            </div>
                            <div>
                              {vulnerability.code_snippet.split('\n').map((line, i) => (
                                <div key={i} className={
                                  line.includes('Vulnerable code') ? 'bg-red-900/30 px-2 -mx-2' : ''
                                }>{line}</div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {vulnerability.recommendation && (
                      <div>
                        <h4 className="text-gray-400 mb-1">Recommendation</h4>
                        <p className="text-secondary-light">{vulnerability.recommendation}</p>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          
          {result.vulnerabilities.length === 0 && (
            <div className="text-center py-10">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">No Vulnerabilities Found</h3>
              <p className="text-gray-400">The contract appears to be secure based on the automated scan.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="source" className="p-4">
          {sourceCode ? (
            <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-300">Contract Source Code</h4>
                <Button variant="outline" size="sm" className="h-8 text-xs border-gray-700 text-gray-300">
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy Code
                </Button>
              </div>
              <div className="bg-slate-950 p-4 rounded-md font-mono text-xs text-white overflow-x-auto">
                <div className="flex items-start">
                  <div className="text-gray-500 mr-4 select-none">
                    {sourceCode.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <div>
                    {sourceCode.split('\n').map((line, i) => (
                      <div key={i}>{line || ' '}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h3 className="text-xl font-medium text-white mb-2">Source Code Not Available</h3>
              <p className="text-gray-400">The contract source code could not be retrieved.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContractScanResults;