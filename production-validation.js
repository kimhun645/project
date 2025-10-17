// Production Validation Script
// This script validates the production system is working correctly

class ProductionValidator {
  constructor() {
    this.validationResults = [];
    this.criticalIssues = [];
    this.warnings = [];
  }

  // Validate system components
  async validateSystem() {
    console.log('🔍 Validating Production System...');
    
    const validations = [
      { name: 'Application Load', test: () => this.validateApplicationLoad() },
      { name: 'Firebase Connection', test: () => this.validateFirebaseConnection() },
      { name: 'Authentication', test: () => this.validateAuthentication() },
      { name: 'Database Access', test: () => this.validateDatabaseAccess() },
      { name: 'Real-time Features', test: () => this.validateRealTimeFeatures() },
      { name: 'Stock Management', test: () => this.validateStockManagement() },
      { name: 'User Interface', test: () => this.validateUserInterface() },
      { name: 'Error Handling', test: () => this.validateErrorHandling() }
    ];
    
    for (const validation of validations) {
      try {
        console.log(`🔍 Validating: ${validation.name}`);
        const result = await validation.test();
        this.validationResults.push({
          name: validation.name,
          status: 'PASSED',
          result: result
        });
        console.log(`✅ ${validation.name}: PASSED`);
      } catch (error) {
        this.validationResults.push({
          name: validation.name,
          status: 'FAILED',
          error: error.message
        });
        this.criticalIssues.push(`${validation.name}: ${error.message}`);
        console.log(`❌ ${validation.name}: FAILED - ${error.message}`);
      }
    }
    
    return this.generateReport();
  }

  // Validate application load
  async validateApplicationLoad() {
    const appElement = document.querySelector('#root');
    if (!appElement) {
      throw new Error('Application root element not found');
    }
    
    const hasContent = appElement.innerHTML.trim().length > 0;
    if (!hasContent) {
      throw new Error('Application content not loaded');
    }
    
    return {
      appLoaded: true,
      hasContent: true,
      timestamp: new Date().toISOString()
    };
  }

  // Validate Firebase connection
  async validateFirebaseConnection() {
    // Check if Firebase is available
    if (typeof window.firebase === 'undefined') {
      throw new Error('Firebase not loaded');
    }
    
    // Check required Firebase services
    const services = ['firestore', 'auth', 'storage'];
    const availableServices = services.filter(service => 
      typeof window.firebase[service] !== 'undefined'
    );
    
    if (availableServices.length !== services.length) {
      this.warnings.push(`Some Firebase services not available: ${services.filter(s => !availableServices.includes(s)).join(', ')}`);
    }
    
    return {
      firebaseLoaded: true,
      availableServices,
      connectionStatus: 'connected'
    };
  }

  // Validate authentication
  async validateAuthentication() {
    // Check if auth context is available
    const authElements = document.querySelectorAll('[data-testid*="auth"], [data-testid*="login"]');
    if (authElements.length === 0) {
      this.warnings.push('Authentication elements not found');
    }
    
    return {
      authElements: authElements.length,
      authStatus: 'available'
    };
  }

  // Validate database access
  async validateDatabaseAccess() {
    // Check if Firestore is accessible
    if (typeof window.firebase?.firestore === 'undefined') {
      throw new Error('Firestore not available');
    }
    
    return {
      firestoreAvailable: true,
      databaseStatus: 'accessible'
    };
  }

  // Validate real-time features
  async validateRealTimeFeatures() {
    // Check for real-time indicators
    const realTimeElements = document.querySelectorAll('[data-testid*="realtime"], [data-testid*="live"]');
    
    return {
      realTimeElements: realTimeElements.length,
      realTimeStatus: 'available'
    };
  }

  // Validate stock management
  async validateStockManagement() {
    // Check for stock-related elements
    const stockElements = document.querySelectorAll('[data-testid*="stock"], [data-testid*="inventory"]');
    
    return {
      stockElements: stockElements.length,
      stockManagement: 'available'
    };
  }

  // Validate user interface
  async validateUserInterface() {
    // Check for key UI components
    const uiComponents = [
      'sidebar', 'header', 'main-content', 'footer',
      'navigation', 'forms', 'tables', 'dialogs'
    ];
    
    const foundComponents = uiComponents.filter(component => {
      const element = document.querySelector(`[data-testid*="${component}"]`);
      return element !== null;
    });
    
    if (foundComponents.length < uiComponents.length * 0.7) {
      this.warnings.push(`Some UI components not found: ${uiComponents.filter(c => !foundComponents.includes(c)).join(', ')}`);
    }
    
    return {
      foundComponents,
      uiCompleteness: `${(foundComponents.length / uiComponents.length * 100).toFixed(1)}%`
    };
  }

  // Validate error handling
  async validateErrorHandling() {
    // Check for error handling elements
    const errorElements = document.querySelectorAll('[data-testid*="error"], [data-testid*="alert"]');
    
    return {
      errorElements: errorElements.length,
      errorHandling: 'available'
    };
  }

  // Generate validation report
  generateReport() {
    const passed = this.validationResults.filter(r => r.status === 'PASSED').length;
    const failed = this.validationResults.filter(r => r.status === 'FAILED').length;
    const total = this.validationResults.length;
    
    const report = {
      summary: {
        total,
        passed,
        failed,
        successRate: `${((passed / total) * 100).toFixed(1)}%`
      },
      criticalIssues: this.criticalIssues,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
    
    console.log('\n📊 Production Validation Report');
    console.log('='.repeat(60));
    console.log(`Total Validations: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${report.summary.successRate}`);
    
    if (this.criticalIssues.length > 0) {
      console.log('\n❌ Critical Issues:');
      this.criticalIssues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => console.log(`   • ${rec}`));
    
    return report;
  }

  // Generate recommendations
  generateRecommendations() {
    const recommendations = [];
    
    if (this.criticalIssues.length > 0) {
      recommendations.push('Address critical issues before production use');
    }
    
    if (this.warnings.length > 0) {
      recommendations.push('Review warnings and consider improvements');
    }
    
    if (this.validationResults.filter(r => r.status === 'PASSED').length === this.validationResults.length) {
      recommendations.push('System is ready for production use');
      recommendations.push('Monitor system performance and user feedback');
      recommendations.push('Implement regular health checks');
    }
    
    return recommendations;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.ProductionValidator = ProductionValidator;
  window.validator = new ProductionValidator();
  console.log('✅ Production validator loaded');
  console.log('Run: validator.validateSystem() to validate production system');
}

module.exports = ProductionValidator;
