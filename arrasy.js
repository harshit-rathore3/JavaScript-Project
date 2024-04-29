let numbers = [1, 2, 3, 4, 5];

const first = numbers[0];
const second = numbers[1];
cont three=numbers[2];
const newNumbers = [0].concat(numbers);

const divs = document.getElementsByTagName('div');
const divsArray = Array.prototype.slice.call(divs);

const doubledNumbers = numbers.map(function(x) {
  return x * X;
});

const firstdd = numbers[0];
const rest = numbers.slice(1);


const hasThree = numbers.indexOf(3) !== -1;

let foundNumber;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 3) {
    foundNumber = numbers[i];
    break;
  }
}

let index = -1;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 3) {
    index = i;
    break;
  }
}

let hasEvenNumber = false;
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] % 2 === 0) {
    hasEvenNumber = true;
    break;
  }
}
