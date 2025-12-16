#!/usr/bin/env node
/**
 * Script to clean up console.log and alert() statements for production
 * Runs on Frontend folder only
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'Frontend', 'src');

// Files to process
const filesToProcess = [];

// Function to recursively find all .js and .jsx files
function findFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      filesToProcess.push(filePath);
    }
  });
}

// Function to fix console statements
function fixConsoleStatements(content) {
  let modified = content;

  // Remove standalone console.log statements (keep them commented for debugging)
  modified = modified.replace(/^(\s*)console\.log\([^)]*\);?\s*$/gm, '$1// console.log removed for production');

  // Keep console.error but only in catch blocks (remove debug ones)
  // This is a simplified approach - we'll comment out all console.errors
  // and developers can uncomment the ones they want to keep
  modified = modified.replace(/^(\s*)console\.error\([^)]*\);?\s*$/gm, '$1// console.error removed for production');

  // Keep console.warn but comment them out
  modified = modified.replace(/^(\s*)console\.warn\([^)]*\);?\s*$/gm, '$1// console.warn removed for production');

  return modified;
}

// Function to check if file needs toast import
function needsToastImport(content) {
  // Check if file has alert() calls and doesn't already import toast
  return content.includes('alert(') && !content.includes('from "react-hot-toast"') && !content.includes("from 'react-hot-toast'");
}

// Function to add toast import
function addToastImport(content) {
  // Find the last import statement
  const importRegex = /^import .+ from .+;?\s*$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const importIndex = content.lastIndexOf(lastImport);
    const afterImport = importIndex + lastImport.length;

    return content.slice(0, afterImport) +
           '\nimport { toast } from "react-hot-toast";' +
           content.slice(afterImport);
  }

  return content;
}

// Function to replace alert with toast
function replaceAlerts(content) {
  let modified = content;

  // Replace simple alert() calls with toast
  modified = modified.replace(/alert\(([^)]+)\)/g, (match, msg) => {
    // Try to determine if it's an error, success, or info message
    if (msg.toLowerCase().includes('error') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('fail')) {
      return `toast.error(${msg})`;
    } else if (msg.toLowerCase().includes('success') || msg.toLowerCase().includes('✅') || msg.toLowerCase().includes('completed')) {
      return `toast.success(${msg})`;
    } else {
      return `toast.info(${msg})`;
    }
  });

  return modified;
}

// Main execution
console.log('🔍 Finding files in Frontend/src...');
findFiles(FRONTEND_DIR);
console.log(`📁 Found ${filesToProcess.length} files to process`);

let modifiedCount = 0;

filesToProcess.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix console statements
  content = fixConsoleStatements(content);

  // Handle alerts
  if (needsToastImport(content)) {
    content = addToastImport(content);
  }
  content = replaceAlerts(content);

  // Only write if file was modified
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    const relativePath = path.relative(__dirname, filePath);
    console.log(`✅ Fixed: ${relativePath}`);
  }
});

console.log(`\n✨ Done! Modified ${modifiedCount} files`);
console.log('\n⚠️  Please review the changes and:');
console.log('1. Uncomment any console.error statements you want to keep for production error tracking');
console.log('2. Test your application to ensure all alerts are working correctly');
console.log('3. Commit the changes when ready');
