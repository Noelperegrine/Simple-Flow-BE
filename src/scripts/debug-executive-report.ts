#!/usr/bin/env ts-node

// Debug the executive report response

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';

// Load development environment
dotenv.config({ path: path.resolve(process.cwd(), '.env.development') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debugExecutiveReport() {
  console.log('🔍 Debugging Executive Report Response');
  console.log('=====================================\n');

  try {
    const mockCustomerData = {
      totalCustomers: 25,
      activeCount: 22,
      churnedCount: 3,
      totalMRR: 15750,
      avgHealth: 78,
      month: 'December 2025'
    };

    console.log('📤 Sending request...');
    const response = await fetch('http://localhost:5000/api/integrations/invoke-llm', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `
          You are a Chief Customer Officer writing a monthly executive brief.
          Analyze the following data and generate a realistic, professional executive summary and strategic insights.
          
          Data Context: ${JSON.stringify(mockCustomerData)}
          
          Requirements:
          1. Write a 2-paragraph executive summary analyzing the health of the business. Be professional but direct.
          2. Create a fictional but realistic "Quote of the Month" from a VP of Sales or Success about the current trend.
          3. Identify 2 strategic "Wins" (positive trends/achievements).
          4. Identify 2 strategic "Risks" (threats/areas for attention).
          
          Output as JSON matching the schema.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                paragraph1: { type: "string" },
                paragraph2: { type: "string" },
                quote: { type: "string" },
                quoteAuthor: { type: "string" }
              }
            },
            wins: {
              type: "array",
              items: {
                type: "object",
                properties: { title: { type: "string" }, content: { type: "string" } }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: { title: { type: "string" }, content: { type: "string" } }
              }
            }
          }
        },
        max_tokens: 2000
      })
    });

    console.log(`📥 Response Status: ${response.status}`);
    
    const data = await response.json() as any;
    
    console.log('📋 Raw Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ Response structure analysis:');
      console.log(`• Has data: ${!!data.data}`);
      console.log(`• Has summary: ${!!data.data?.summary}`);
      console.log(`• Has paragraph1: ${!!data.data?.summary?.paragraph1}`);
      console.log(`• Has paragraph2: ${!!data.data?.summary?.paragraph2}`);
      console.log(`• Has wins: ${Array.isArray(data.data?.wins)} (count: ${data.data?.wins?.length || 0})`);
      console.log(`• Has risks: ${Array.isArray(data.data?.risks)} (count: ${data.data?.risks?.length || 0})`);
    } else {
      console.log('❌ Request failed:', data.error);
    }

  } catch (error: any) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugExecutiveReport();