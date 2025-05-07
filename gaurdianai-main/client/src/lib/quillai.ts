// Quill.ai Contract Security Kit Integration

// Define vulnerability severity types
export type VulnerabilitySeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

// Define vulnerability finding interface
export interface VulnerabilityFinding {
  id: string;
  name: string;
  description: string;
  severity: VulnerabilitySeverity;
  line_number?: number;
  code_snippet?: string;
  recommendation?: string;
  category: string;
}

// Define scan result interface
export interface ContractScanResult {
  contract_address: string;
  scan_id: string;
  timestamp: string;
  overall_score: number; // 0-100 scale, higher is safer
  vulnerability_count: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  vulnerabilities: VulnerabilityFinding[];
  gas_optimization_suggestions?: string[];
  audit_summary: string;
}

// Mock vulnerability categories for demo
const VULNERABILITY_CATEGORIES = [
  'Reentrancy',
  'Integer Overflow/Underflow',
  'Access Control',
  'Unchecked External Calls',
  'Flash Loan Attacks',
  'Front-Running',
  'Oracle Manipulation',
  'Gas Optimization',
  'Logic Errors',
  'Denial of Service'
];

// Mock vulnerability names by category
const VULNERABILITY_NAMES: Record<string, string[]> = {
  'Reentrancy': [
    'Single Function Reentrancy',
    'Cross-Function Reentrancy',
    'Cross-Contract Reentrancy'
  ],
  'Integer Overflow/Underflow': [
    'Integer Overflow in Calculation',
    'Integer Underflow in Balance Update',
    'Unchecked Math Operation'
  ],
  'Access Control': [
    'Missing Access Controls',
    'Improper Role Validation',
    'Privileged Function Exposure'
  ],
  'Unchecked External Calls': [
    'Unchecked Call Return Value',
    'Unsafe External Call',
    'Missing Return Value Check'
  ],
  'Flash Loan Attacks': [
    'Vulnerable to Price Manipulation',
    'DEX Pool Manipulation Risk',
    'Flash Loan Oracle Attack Vector'
  ],
  'Front-Running': [
    'Unprotected Function Vulnerable to Front-Running',
    'Unprotected Order Execution',
    'Missing Commit-Reveal Pattern'
  ],
  'Oracle Manipulation': [
    'Single Oracle Dependency',
    'Time-Weighted Average Price Manipulation',
    'Oracle Update Mechanism Flaw'
  ],
  'Gas Optimization': [
    'Inefficient Storage Layout',
    'Redundant Operations',
    'Excessive Loop Operations'
  ],
  'Logic Errors': [
    'Incorrect Business Logic Implementation',
    'State Machine Error',
    'Conditional Check Flaw'
  ],
  'Denial of Service': [
    'Block Gas Limit DoS',
    'External Call Dependency DoS',
    'Array Length Manipulation DoS'
  ]
};

// Function to simulate scanning a contract with Quill.ai
export async function scanContract(address: string): Promise<ContractScanResult> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate random number of findings based on severity
    const criticalCount = Math.floor(Math.random() * 2); // 0-1
    const highCount = Math.floor(Math.random() * 3); // 0-2
    const mediumCount = Math.floor(Math.random() * 5); // 0-4
    const lowCount = Math.floor(Math.random() * 7); // 0-6
    const infoCount = Math.floor(Math.random() * 5); // 0-4
    
    // Calculate overall score (higher is better, scale 0-100)
    // Score is inversely related to weighted vulnerability count
    const totalWeightedVulnerabilities = 
      criticalCount * 25 + 
      highCount * 10 + 
      mediumCount * 5 + 
      lowCount * 2 + 
      infoCount * 0.5;
    
    // Cap the max deduction at 100
    const scorePenalty = Math.min(100, totalWeightedVulnerabilities);
    const overallScore = Math.max(0, 100 - scorePenalty);
    
    // Generate vulnerabilities
    const vulnerabilities: VulnerabilityFinding[] = [];
    
    // Helper function to generate random vulnerability findings
    const generateFindings = (count: number, severity: VulnerabilitySeverity) => {
      for (let i = 0; i < count; i++) {
        // Select random category
        const category = VULNERABILITY_CATEGORIES[Math.floor(Math.random() * VULNERABILITY_CATEGORIES.length)];
        
        // Select random vulnerability name from that category
        const nameOptions = VULNERABILITY_NAMES[category];
        const name = nameOptions[Math.floor(Math.random() * nameOptions.length)];
        
        // Generate random line number between 10 and 500
        const lineNumber = Math.floor(Math.random() * 490) + 10;
        
        vulnerabilities.push({
          id: `VULN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name,
          description: `The contract has a potential ${name.toLowerCase()} vulnerability that could lead to ${
            severity === 'CRITICAL' ? 'severe security breaches and loss of funds' :
            severity === 'HIGH' ? 'significant security issues' :
            severity === 'MEDIUM' ? 'moderate security concerns' :
            severity === 'LOW' ? 'minor security issues' : 'informational concerns'
          }.`,
          severity,
          line_number: lineNumber,
          code_snippet: `function transfer${i}(address _to, uint256 _amount) public {
    // Vulnerable code at line ${lineNumber}
    balances[msg.sender] -= _amount;
    balances[_to] += _amount;
    // Missing important checks or validations
}`,
          recommendation: `Implement proper ${
            category === 'Reentrancy' ? 'checks-effects-interactions pattern' :
            category === 'Integer Overflow/Underflow' ? 'SafeMath library or Solidity 0.8+ built-in overflow checks' :
            category === 'Access Control' ? 'role-based access control' :
            category === 'Unchecked External Calls' ? 'return value checks' :
            category === 'Flash Loan Attacks' ? 'time-weighted price oracles or internal price discovery mechanisms' :
            category === 'Front-Running' ? 'commit-reveal schemes or transaction ordering protection' :
            category === 'Oracle Manipulation' ? 'multiple oracle sources with median price calculation' :
            category === 'Gas Optimization' ? 'efficient storage patterns and operation batching' :
            category === 'Logic Errors' ? 'thorough state machine validation and invariant checks' :
            'resource consumption limits and fallback mechanisms'
          } to prevent this vulnerability.`,
          category
        });
      }
    };
    
    // Generate vulnerabilities for each severity level
    generateFindings(criticalCount, 'CRITICAL');
    generateFindings(highCount, 'HIGH');
    generateFindings(mediumCount, 'MEDIUM');
    generateFindings(lowCount, 'LOW');
    generateFindings(infoCount, 'INFO');
    
    // Sort vulnerabilities by severity
    vulnerabilities.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'INFO': 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
    
    // Generate gas optimization suggestions if there are gas optimization findings
    const gasOptimizationSuggestions = vulnerabilities
      .filter(v => v.category === 'Gas Optimization')
      .map(() => {
        const suggestions = [
          'Use packed storage variables to optimize gas usage',
          'Replace memory with calldata for read-only function parameters',
          'Use short-circuiting in conditional statements to reduce gas',
          'Implement gas-efficient smart contract patterns',
          'Cache array length outside of for loops',
          'Use assembly for efficient bit manipulation operations',
          'Avoid unnecessary SLOAD operations by caching values',
          'Pre-compute values off-chain when possible',
          'Use events instead of storing unnecessary data',
          'Optimize contract deployment by minimizing contract size'
        ];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
      });
    
    // Generate audit summary
    const auditSummary = generateAuditSummary(
      address,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      infoCount,
      overallScore,
      vulnerabilities
    );
    
    return {
      contract_address: address,
      scan_id: `SCAN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      overall_score: overallScore,
      vulnerability_count: {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        info: infoCount
      },
      vulnerabilities,
      gas_optimization_suggestions: gasOptimizationSuggestions,
      audit_summary: auditSummary
    };
  } catch (error) {
    console.error('Error scanning contract:', error);
    throw new Error('Failed to scan contract');
  }
}

// Helper function to generate a comprehensive audit summary
function generateAuditSummary(
  address: string,
  criticalCount: number,
  highCount: number,
  mediumCount: number,
  lowCount: number,
  infoCount: number,
  score: number,
  vulnerabilities: VulnerabilityFinding[]
): string {
  // Calculate total findings
  const totalFindings = criticalCount + highCount + mediumCount + lowCount + infoCount;
  
  // Determine overall risk level
  let riskLevel = 'Low';
  if (criticalCount > 0 || highCount > 1) {
    riskLevel = 'Critical';
  } else if (highCount > 0 || mediumCount > 2) {
    riskLevel = 'High';
  } else if (mediumCount > 0 || lowCount > 3) {
    riskLevel = 'Medium';
  }
  
  // Get most common vulnerability categories
  const categoryCount: Record<string, number> = {};
  vulnerabilities.forEach(v => {
    categoryCount[v.category] = (categoryCount[v.category] || 0) + 1;
  });
  
  // Sort categories by count
  const sortedCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category]) => category);
  
  // Generate primary concerns part
  let primaryConcerns = '';
  if (sortedCategories.length > 0) {
    primaryConcerns = `Primary concerns include ${sortedCategories.join(', ')}.`;
  }
  
  // Generate audit summary
  return `
The smart contract at ${address} has been analyzed by the Quill.ai Contract Security Kit.

Overall Security Score: ${score.toFixed(1)}/100 (${riskLevel} Risk)

Summary: The audit identified ${totalFindings} findings (${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low, ${infoCount} informational). ${primaryConcerns}

${criticalCount > 0 ? 
  `CRITICAL FINDINGS: Immediate attention required to address ${criticalCount} critical vulnerabilities that pose significant security risks.` : 
  ''}

${
  // Provide specific recommendations based on the findings
  vulnerabilities.length > 0 ?
    'RECOMMENDATIONS: ' + [
      criticalCount > 0 ? 'Address all critical and high severity findings before deployment' : '',
      highCount > 0 ? 'Implement thorough testing for identified high-risk vulnerabilities' : '',
      mediumCount > 0 ? 'Review and fix medium severity issues in the next development cycle' : '',
      lowCount > 0 ? 'Consider addressing low severity findings to improve overall security' : '',
      'Consider using OpenZeppelin libraries for standard functionality',
      'Implement comprehensive test coverage for all contract functions'
    ].filter(Boolean).join('. ') + '.' :
    ''
}

This report provides an initial automated assessment and should be followed by a thorough manual security review.
  `.trim();
}

// Function to fetch contract source code from blockchain explorer
export async function fetchContractSource(address: string): Promise<string> {
  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Return mock contract source code
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title ${getRandomContractName()}
 * @dev Smart contract for ${getRandomContractPurpose()}
 */
contract ${getRandomContractName()} {
    address public owner;
    mapping(address => uint256) public balances;
    uint256 public totalSupply;
    bool private locked;
    
    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);
    
    constructor() {
        owner = msg.sender;
        totalSupply = 1000000 * 10**18;
        balances[owner] = totalSupply;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier nonReentrant() {
        require(!locked, "No reentrancy");
        locked = true;
        _;
        locked = false;
    }
    
    function transfer(address _to, uint256 _amount) public {
        require(_to != address(0), "Invalid address");
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
        
        emit Transfer(msg.sender, _to, _amount);
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }
    
    function withdraw(uint256 _amount) public nonReentrant {
        require(balances[msg.sender] >= _amount, "Insufficient balance");
        
        balances[msg.sender] -= _amount;
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawal(msg.sender, _amount);
    }
    
    function changeOwner(address _newOwner) public onlyOwner {
        owner = _newOwner;
    }
    
    function getBalance(address _account) public view returns (uint256) {
        return balances[_account];
    }
    
    receive() external payable {
        deposit();
    }
}`;
  } catch (error) {
    console.error('Error fetching contract source:', error);
    throw new Error('Failed to fetch contract source code');
  }
}

// Helper functions for generating mock contract details
function getRandomContractName(): string {
  const prefixes = ['Guardian', 'Secure', 'Decentralized', 'Token', 'Smart', 'Chain', 'Block', 'Crypto', 'DeFi', 'Meta'];
  const suffixes = ['Vault', 'Protocol', 'Exchange', 'DAO', 'Token', 'Bridge', 'Pool', 'Fund', 'Swap', 'Market'];
  
  return prefixes[Math.floor(Math.random() * prefixes.length)] + 
         suffixes[Math.floor(Math.random() * suffixes.length)];
}

function getRandomContractPurpose(): string {
  const purposes = [
    'token trading and exchange',
    'decentralized finance operations',
    'secure asset management',
    'cross-chain bridging',
    'governance voting',
    'yield farming and staking',
    'NFT marketplace operations',
    'liquidity provision',
    'decentralized autonomous organization',
    'secure payment processing'
  ];
  
  return purposes[Math.floor(Math.random() * purposes.length)];
}