
// Refactored JavaScript Code

// Define an array of numbers
const numbers = [1, 2, 3, 4, 5];

// Extract the first, second, and third elements from the numbers array
const [first, second, third] = numbers;

// Create a new array by concatenating 0 to the beginning of the numbers array
const newNumbers = [0, ...numbers];

// Convert the HTMLCollection of div elements to an array
const divs = Array.from(document.getElementsByTagName('div'));

// Create a new array with each number in the numbers array doubled
const doubledNumbers = numbers.map(num => num * 2);

// Extract the first element and the rest of the elements from the numbers array
const [firstElement, ...rest] = numbers;

// Check if the number 3 is present in the numbers array
const hasThree = numbers.includes(3);

// Find the first number greater than 3 in the numbers array
let foundNumber;
for (const num of numbers) {
  if (num > 3) {
    foundNumber = num;
    break;
  }
}

// Find the index of the first number greater than 3 in the numbers array
let index = numbers.findIndex(num => num > 3);

// Check if there is an even number in the numbers array
const hasEvenNumber = numbers.some(num => num % 2 === 0);
