// tests/addArtistFullSchema.spec.ts
import { test, expect } from '@playwright/test';
import { addArtistFullSchema } from '@/schemas/addArtistFullSchema';
import * as fs from 'fs';
import * as path from 'path';

test('addArtistFullSchema should validate static testArtistData.json', async () => {
  // Build the path to the JSON file inside your tests folder.
  const jsonFilePath = path.join(__dirname, './testArtistData.json');
  
  // Read and parse the JSON file.
  const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
  const testData = JSON.parse(rawData);

  // Validate the data using your Zod schema.
  const validationResult = addArtistFullSchema.safeParse(testData);

  // Assert that validation succeeds.
  expect(validationResult.success).toBe(true);

  // Optionally, if validation is successful, check a few properties.
  if (validationResult.success) {
    expect(validationResult.data.artist.name).toBe('Integration Test Artist');
    expect(validationResult.data.platformData[0].platform).toBe('spotify');
  }
});

test('addArtistFullSchema should fail validation for invalid data from testArtistError.json', async () => {
    // Build the path to the invalid JSON file.
    const jsonFilePath = path.join(__dirname, 'testArtistError.json');
    
    // Read and parse the JSON file.
    const rawData = fs.readFileSync(jsonFilePath, 'utf-8');
    const testData = JSON.parse(rawData);
  
    // Validate the data using the Zod schema.
    const result = addArtistFullSchema.safeParse(testData);
  
    // Expect the schema validation to fail.
    expect(result.success).toBe(false);
  
    if (!result.success) {
      // Check that one of the error issues indicates that "date" is missing within metricData.
      // Typically, the error path for a missing field "date" in the first element of metricData is: ["metricData", 0, "date"]
      const missingDateError = result.error.issues.find(
        (issue) =>
          Array.isArray(issue.path) &&
          issue.path[0] === "metricData" &&
          issue.path[2] === "artist_id"
      );
      expect(missingDateError).toBeDefined();
    }
  });