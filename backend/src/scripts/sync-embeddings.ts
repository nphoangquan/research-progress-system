#!/usr/bin/env ts-node
/**
 * Embedding Sync Script
 * 
 * Generates and updates embeddings for existing data without embeddings.
 * Can be run manually or as part of deployment/CI/CD pipeline.
 * 
 * Usage:
 *   npm run sync-embeddings              - Sync all entities
 *   npm run sync-embeddings -- projects  - Sync projects only
 *   npm run sync-embeddings -- tasks     - Sync tasks only
 *   npm run sync-embeddings -- documents - Sync documents only
 */

import dotenv from 'dotenv';
import path from 'path';
import embeddingSyncService from '../services/embeddingSync.service';
import logger from '../utils/logger';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function printHeader() {
  console.log('\n' + colors.cyan + colors.bright + '═'.repeat(60) + colors.reset);
  console.log(colors.cyan + colors.bright + '  EMBEDDING SYNC SCRIPT' + colors.reset);
  console.log(colors.cyan + colors.bright + '═'.repeat(60) + colors.reset + '\n');
}

function printSuccess(message: string) {
  console.log(colors.green + '[SUCCESS] ' + message + colors.reset);
}

function printError(message: string) {
  console.log(colors.red + '[ERROR] ' + message + colors.reset);
}

function printInfo(message: string) {
  console.log(colors.blue + '[INFO] ' + message + colors.reset);
}

function printWarning(message: string) {
  console.log(colors.yellow + '[WARNING] ' + message + colors.reset);
}

function printStats(stats: { total: number; synced: number; failed: number }) {
  console.log(`  Total:  ${stats.total}`);
  console.log(`  ${colors.green}Synced: ${stats.synced}${colors.reset}`);
  if (stats.failed > 0) {
    console.log(`  ${colors.red}Failed: ${stats.failed}${colors.reset}`);
  }
}

async function main() {
  printHeader();

  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    printError('OPENAI_API_KEY chưa được cấu hình trong file .env');
    printInfo('Vui lòng thêm OPENAI_API_KEY vào file .env để sử dụng tính năng semantic search.');
    process.exit(1);
  }

  // Get entity type from command line arguments
  const args = process.argv.slice(2);
  const entityType = args[0]?.toLowerCase();

  try {
    const startTime = Date.now();

    if (!entityType || entityType === 'all') {
      // Sync all entities
      printInfo('Bắt đầu đồng bộ embeddings cho TẤT CẢ entities...\n');

      const results = await embeddingSyncService.syncAll();

      console.log('\n' + colors.bright + 'KẾT QUẢ ĐỒNG BỘ:' + colors.reset + '\n');
      
      console.log(colors.bright + 'Projects:' + colors.reset);
      printStats(results.projects);
      
      console.log('\n' + colors.bright + 'Tasks:' + colors.reset);
      printStats(results.tasks);
      
      console.log('\n' + colors.bright + 'Documents:' + colors.reset);
      printStats(results.documents);

      const totalSynced = results.projects.synced + results.tasks.synced + results.documents.synced;
      const totalFailed = results.projects.failed + results.tasks.failed + results.documents.failed;

      console.log('\n' + colors.bright + 'TỔNG KẾT:' + colors.reset);
      console.log(`  ${colors.green}Thành công: ${totalSynced}${colors.reset}`);
      if (totalFailed > 0) {
        console.log(`  ${colors.red}Thất bại: ${totalFailed}${colors.reset}`);
      }

    } else if (entityType === 'projects') {
      // Sync projects only
      printInfo('Bắt đầu đồng bộ embeddings cho PROJECTS...\n');
      
      const results = await embeddingSyncService.syncProjects();
      
      console.log('\n' + colors.bright + 'Projects:' + colors.reset);
      printStats(results);

    } else if (entityType === 'tasks') {
      // Sync tasks only
      printInfo('Bắt đầu đồng bộ embeddings cho TASKS...\n');
      
      const results = await embeddingSyncService.syncTasks();
      
      console.log('\n' + colors.bright + 'Tasks:' + colors.reset);
      printStats(results);

    } else if (entityType === 'documents') {
      // Sync documents only
      printInfo('Bắt đầu đồng bộ embeddings cho DOCUMENTS...\n');
      
      const results = await embeddingSyncService.syncDocuments();
      
      console.log('\n' + colors.bright + 'Documents:' + colors.reset);
      printStats(results);

    } else {
      printError(`Entity type không hợp lệ: "${entityType}"`);
      printInfo('Các entity type hợp lệ: all (default), projects, tasks, documents');
      process.exit(1);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n' + colors.bright + `Thời gian thực hiện: ${duration}s` + colors.reset);
    printSuccess('Đồng bộ embeddings hoàn tất!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n' + colors.red + colors.bright + 'LỖI:' + colors.reset);
    
    if (error instanceof Error) {
      console.error(colors.red + error.message + colors.reset);
      logger.error('Embedding sync failed:', error);
    } else {
      console.error(colors.red + 'Unknown error occurred' + colors.reset);
      logger.error('Embedding sync failed:', error);
    }

    console.log('\n' + colors.yellow + 'GỢI Ý:' + colors.reset);
    console.log('  - Kiểm tra OPENAI_API_KEY trong file .env');
    console.log('  - Kiểm tra kết nối database');
    console.log('  - Xem logs chi tiết trong logs/error.log\n');

    process.exit(1);
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  printWarning('\n\nĐang dừng script...');
  process.exit(0);
});

// Run the script
main();

