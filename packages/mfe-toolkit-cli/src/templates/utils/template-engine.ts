/**
 * Template Engine for CLI Templates
 * 
 * Provides a clean way to distinguish between template placeholders and actual JavaScript code.
 * Uses {{variable}} syntax for template variables, preserving ${} for JavaScript template literals.
 */

export interface TemplateVariables {
  [key: string]: string | number | boolean | object | undefined;
}

/**
 * Template function that replaces {{variable}} placeholders with actual values
 * while preserving JavaScript template literals (${...}) unchanged.
 * 
 * @example
 * ```typescript
 * const result = template({
 *   name: 'my-app',
 *   version: '1.0.0'
 * })`
 *   const appName = '{{name}}';
 *   console.log(\`Welcome to \${appName}\`); // JS template literal preserved
 *   const version = '{{version}}';
 * `;
 * ```
 */
export function template(variables: TemplateVariables) {
  return (strings: TemplateStringsArray, ...values: any[]): string => {
    // Reconstruct the full template string
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {
      result += String(values[i]) + strings[i + 1];
    }
    
    // Replace {{variable}} placeholders with actual values
    return result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in variables) {
        const value = variables[key];
        
        // Handle different types appropriately
        if (value === undefined) {
          console.warn(`Template variable '${key}' is undefined`);
          return 'undefined';
        }
        
        if (typeof value === 'object') {
          // For objects/arrays, stringify them (useful for JSON)
          return JSON.stringify(value, null, 2);
        }
        
        // For primitives, convert to string
        return String(value);
      }
      
      // Warn about unmatched placeholders
      console.warn(`Template variable '${key}' not found in provided variables`);
      return match; // Keep the placeholder if not found
    });
  };
}

/**
 * Helper to format JSON for embedding in templates
 * Ensures proper formatting without extra quotes
 */
export function formatJson(value: any, indent: number = 0): string {
  if (value === undefined || value === null) {
    return String(value);
  }
  
  if (Array.isArray(value) && value.length === 0) {
    return '[]';
  }
  
  if (typeof value === 'object' && Object.keys(value).length === 0) {
    return '{}';
  }
  
  // For non-empty objects/arrays, format nicely
  return JSON.stringify(value, null, indent);
}