/**
 * Generates an array of positive numbers with two decimal places that sum to 1.0
 * @param count - Number of values to generate
 * @returns Array of positive numbers that sum to 1.0
 */
export function getRandomRange(count: number): number[] {
  if (count <= 0) {
    throw new Error('Count must be positive');
  }

  if (count === 1) {
    return [1.0];
  }

  // Generate random values
  const values: number[] = [];
  for (let i = 0; i < count; i++) {
    values.push(Math.random());
  }

  // Calculate sum
  const sum = values.reduce((acc, val) => acc + val, 0);

  // Normalize to sum to 1.0 and round to 2 decimal places
  const normalized = values.map(val => Math.round((val / sum) * 100) / 100);

  // Adjust for rounding errors to ensure sum equals 1.0
  const currentSum = normalized.reduce((acc, val) => acc + val, 0);
  const difference = Math.round((1.0 - currentSum) * 100) / 100;
  
  if (difference !== 0) {
    // Add the difference to the first element
    normalized[0] = Math.round((normalized[0] + difference) * 100) / 100;
  }

  return normalized;
}
