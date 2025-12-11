#!/usr/bin/env ts-node

// Quick OpenAI Service Test (no server required)
// This script tests the OpenAI service directly without needing the backend server

import OpenAIService from '../services/openaiService';
import dotenv from 'dotenv';
import path from 'path';

// Load development environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function quickTest() {
  console.log('🔬 Quick OpenAI Service Test');
  console.log('============================\n');

  try {
    // Check environment variables
    console.log('📋 Checking environment variables...');
    const apiKey = process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID;

    if (!apiKey) {
      throw new Error('❌ OPENAI_API_KEY not found in environment');
    }

    if (!projectId) {
      throw new Error('❌ OPENAI_PROJECT_ID not found in environment');
    }

    console.log(`✅ API Key: ${apiKey.substring(0, 15)}...`);
    console.log(`✅ Project ID: ${projectId}\n`);

    // Initialize service
    console.log('🔧 Initializing OpenAI service...');
    const openaiService = new OpenAIService();
    console.log('✅ Service initialized\n');

    // Test connection
    console.log('🌐 Testing connection...');
    const connectionTest = await openaiService.testConnection();
    
    if (!connectionTest) {
      throw new Error('❌ Connection test failed');
    }
    console.log('✅ Connection successful\n');

    // Test executive report generation
    console.log('📊 Testing executive report generation...');
    const mockData = {
      totalCustomers: 25,
      activeCount: 22,
      churnedCount: 3,
      totalMRR: 15750,
      avgHealth: 78,
      month: 'December 2025'
    };

    const result = await openaiService.invokeLLM({
      prompt: `You are a Chief Customer Officer. Generate a brief executive summary based on this data: ${JSON.stringify(mockData)}. 
      
      Respond with JSON containing:
      - summary: object with paragraph1 and paragraph2 strings
      - wins: array of 2 objects with title and content
      - risks: array of 2 objects with title and content
      
      Keep responses concise but professional.`,
      response_json_schema: {
        type: 'object',
        properties: {
          summary: {
            type: 'object',
            properties: {
              paragraph1: { type: 'string' },
              paragraph2: { type: 'string' }
            }
          },
          wins: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' }
              }
            }
          },
          risks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: { type: 'string' }
              }
            }
          }
        }
      },
      max_tokens: 1500
    });

    if (!result.success) {
      throw new Error(`❌ Report generation failed: ${result.error}`);
    }

    console.log('✅ Executive report generated successfully!\n');
    console.log('📋 Sample Output:');
    console.log('─'.repeat(50));
    console.log(`Summary P1: ${result.data.summary.paragraph1.substring(0, 100)}...`);
    console.log(`Summary P2: ${result.data.summary.paragraph2.substring(0, 100)}...`);
    console.log(`Wins: ${result.data.wins.length} items`);
    console.log(`Risks: ${result.data.risks.length} items`);
    console.log('─'.repeat(50));

    console.log('\n🎉 All tests passed! OpenAI integration is working correctly.');
    
    // Performance info
    console.log('\n📈 Performance Info:');
    console.log('• API calls: 2 (connection test + report generation)');
    console.log('• Estimated cost: ~$0.01-0.02 USD');
    console.log('• Ready for production use');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('• Verify your OPENAI_API_KEY is correct');
    console.log('• Ensure your OpenAI account has billing enabled');
    console.log('• Check your project ID is valid');
    console.log('• Verify internet connection');
    process.exit(1);
  }
}

quickTest();