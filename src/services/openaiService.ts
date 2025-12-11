import fetch from 'node-fetch';

interface LLMRequest {
  prompt: string;
  response_json_schema?: any;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

interface LLMResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class OpenAIService {
  private apiKey: string;
  private projectId?: string;

  constructor(customApiKey?: string) {
    const apiKey = customApiKey || process.env.OPENAI_API_KEY;
    const projectId = process.env.OPENAI_PROJECT_ID;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = apiKey;
    this.projectId = projectId;
  }

  async invokeLLM({
    prompt,
    response_json_schema,
    model = 'gpt-4o',
    temperature = 0.7,
    max_tokens = 4000
  }: LLMRequest): Promise<LLMResponse> {
    try {
      const headers: any = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      // Add project ID if available
      if (this.projectId) {
        headers['OpenAI-Project'] = this.projectId;
      }

      const requestBody: any = {
        model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature,
        max_tokens
      };

      // Add structured output if schema provided
      if (response_json_schema) {
        requestBody.response_format = { 
          type: "json_object" 
        };
        
        // Add clear JSON format instructions to the prompt
        const originalPrompt = requestBody.messages[0].content;
        requestBody.messages[0].content = originalPrompt + 
          '\n\nPlease respond with valid JSON data (not the schema itself) that matches the following structure. Fill in the actual content:\n' +
          'Expected format: ' + this.generateExampleFromSchema(response_json_schema);
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json() as any;
        throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json() as any;
      const content = data.choices[0].message.content;

      // Parse JSON response if structured output was requested
      let result = content;
      if (response_json_schema) {
        try {
          result = JSON.parse(content);
        } catch (parseError) {
          throw new Error(`Failed to parse JSON response: ${parseError}`);
        }
      }

      return {
        success: true,
        data: result
      };

    } catch (error: any) {
      console.error('❌ OpenAI LLM error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test connection by making a simple API call
   */
  async testConnection(): Promise<boolean> {
    try {
      const testResponse = await this.invokeLLM({
        prompt: 'Say "Hello" in JSON format',
        response_json_schema: { type: 'object' },
        max_tokens: 50
      });
      
      return testResponse.success === true;
    } catch (error) {
      console.error('❌ OpenAI connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate an example structure from JSON schema
   */
  private generateExampleFromSchema(schema: any): string {
    if (schema.type === 'object') {
      const example: any = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          const propSchema = prop as any;
          if (propSchema.type === 'string') {
            example[key] = `<${key} text here>`;
          } else if (propSchema.type === 'array') {
            example[key] = [this.generateExampleFromSchema(propSchema.items)];
          } else if (propSchema.type === 'object') {
            example[key] = JSON.parse(this.generateExampleFromSchema(propSchema));
          }
        }
      }
      return JSON.stringify(example, null, 2);
    }
    return '{}';
  }
}

export default OpenAIService;