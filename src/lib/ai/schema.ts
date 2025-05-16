import { Tool, Type } from '@google/genai';
import functionDeclarations from '@/data/functionDeclarations.json';

function convertToGeminiSchema(declaration: any): Tool {
  const convertedDeclaration = {
    ...declaration,
    parameters: declaration.parameters && {
      ...declaration.parameters,
      properties: Object.fromEntries(
        Object.entries(declaration.parameters.properties || {}).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            type: value.type as Type,
          },
        ])
      ),
    },
  };

  return {
    functionDeclarations: [convertedDeclaration],
  };
}

export const getToolDefinitions = () => functionDeclarations.map(convertToGeminiSchema);