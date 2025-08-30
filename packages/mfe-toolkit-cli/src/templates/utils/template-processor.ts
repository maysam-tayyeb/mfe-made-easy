import * as fs from 'fs';
import * as path from 'path';

/**
 * Process a template file by replacing {{variable}} placeholders
 * @param templatePath Path to the template file
 * @param variables Variables to replace in the template
 * @returns Processed template string
 */
export function processTemplateFile(templatePath: string, variables: Record<string, any>): string {
  const template = fs.readFileSync(templatePath, 'utf-8');
  return processTemplate(template, variables);
}

/**
 * Process a template string by replacing {{variable}} placeholders
 * @param template Template string
 * @param variables Variables to replace in the template
 * @returns Processed template string
 */
export function processTemplate(template: string, variables: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    if (key in variables) {
      const value = variables[key];
      
      // Handle different types appropriately
      if (value === undefined || value === null) {
        return '';
      }
      
      if (typeof value === 'string') {
        return value;
      }
      
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      
      // For objects/arrays, stringify them
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      
      return String(value);
    }
    
    // Keep the placeholder if variable not found
    console.warn(`Template variable '${key}' not found in provided variables`);
    return match;
  });
}

/**
 * Load all templates from a directory
 * @param templatesDir Directory containing template files
 * @returns Map of template names to their content
 */
export function loadTemplates(templatesDir: string): Map<string, string> {
  const templates = new Map<string, string>();
  
  if (!fs.existsSync(templatesDir)) {
    throw new Error(`Templates directory not found: ${templatesDir}`);
  }
  
  const files = fs.readdirSync(templatesDir);
  
  for (const file of files) {
    if (file.endsWith('.template')) {
      const name = file.replace('.template', '');
      const content = fs.readFileSync(path.join(templatesDir, file), 'utf-8');
      templates.set(name, content);
    }
  }
  
  return templates;
}

/**
 * Helper to get the templates directory for a specific framework
 * @param frameworkDir Directory of the framework template
 * @returns Path to the templates subdirectory
 */
export function getTemplatesDir(frameworkDir: string): string {
  return path.join(frameworkDir, 'templates');
}