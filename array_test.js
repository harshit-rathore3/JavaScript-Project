
// Refactored code with improved readability, efficiency, modularity, and adherence to best practices.

// Function to calculate the sum of two numbers
function calculateSum(a, b) {
  return a + b;
}

// Function to calculate the sum of two numbers
function calculateTotalOfTwoNumbers(a, b) {
  return a + b;
}

// Function to add two numbers
function add(x, y) {
  return x + y;
}

// Function to greet a person with their full name
function greet(firstName, lastName) {
  console.log(`Hello, ${firstName} ${lastName}!`);
}

// Function to multiply two numbers
function multiply(a, b) {
  return a * b;
}

// Function to square a number
function square(x) {
  return x * x;
}

// Function to say "Hello!"
function sayHello() {
  console.log('Hello!');
}

// Function to double a number and then square the result
function doubleAndSquare(x) {
  const doubled = x * 2;
  return doubled * doubled;
}

// Map function to square each number in the array
const numbers = [1, 2, 3, 4, 5];
const squaredNumbers = numbers.map(x => x * x);

// Asynchronous function to fetch data from an API
function fetchDataFromApi(callback) {
  setTimeout(() => {
    const data = 'Hello, world!';
    callback(data);
  }, 1000);
}

// Object with a name property and a sayHello method
const person = {
  name: 'John',
  sayHello() {
    console.log(`Hello, ${this.name}!`);
  }
};

// Function to create a copy of an array
function createArrayCopy(items) {
  const itemsCopy = [];
  for (let i = 0; i < items.length; i++) {
    itemsCopy[i] = items[i];
  }
  return itemsCopy;
}

// Function to process an array using a callback
function processArray(arr, callback) {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i]);
  }
}
