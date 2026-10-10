/**
 * tests/logic.test.js - Contract Verification Suite
 * Checks that all required functions exist and match the contract in Section 6.
 */

const assert = require('assert');
const logic = require('../logic.js');
const PRESETS = require('../presets.js');

const requiredFunctions = [
  'getDegrees',
  'getOddJunctions',
  'checkHandshaking',
  'isConnected',
  'getVerdict',
  'shortestPaths',
  'getPath',
  'findRoute',
  'solvePostman'
];

console.log('--- Verifying logic.js contract ---');
let allPassed = true;

requiredFunctions.forEach((fnName) => {
  const isFn = typeof logic[fnName] === 'function';
  if (isFn) {
    console.log(`PASS: function ${fnName} exists`);
  } else {
    console.error(`FAIL: function ${fnName} is missing or not a function`);
    allPassed = false;
  }
});

console.log('\n--- Verifying presets.js ---');
if (Array.isArray(PRESETS) && PRESETS.length === 5) {
  console.log(`PASS: presets.js defines exactly 5 test maps`);
} else {
  console.error(`FAIL: presets.js must export an array of 5 test maps`);
  allPassed = false;
}

assert.strictEqual(allPassed, true, 'All contract checks must pass');
console.log('\nAll contract stubs and presets successfully verified!');
