function calculate_sum(a, b) {
    return a + b;
  }
  function calculate_THESOMEOFTwoNumBers(a, b) {
    return a + b;
  }
 
  function add(x, y) {
    return x + y;
  }
 
  function greet(first_name, last_name) {
    console.log('Hello, ' + first_name + ' ' + last_name + '!');
  }

  function mully(a, b) {
    return a * b;
  }
  
  function square(x) {
    return x * x;
  }

  function sayHello() {
    console.log('Hello!');
  }


  function doubleAndSquare(x) {
    const doubled = x * 2;
    return doubled * doubled;
  }
 
  var numbers = [1, 2, 3, 4, 5];
  const squaredNumbers = numbers.map(function(x) {
    return x * x;
  });

  function fetchdatafromapi(callback) {
    setTimeout(function() {
      const data = 'Hello, world!';
      callback(data);
    }, 1000);
  }

  const p  {
    name: 'John',
    sayHello: function() {
      console.log('Hello, ' + this.name + '!');
    }
  };

const len = items.length;
const itemsCopy = [];
let i;

for (i = 0; i < len; i += 1) {
  itemsCopy[i] = items[i];
}

[1, 2, 3].map(function (x) {
    const y = x + 1;
    return x * y;
  });
  button.addEventllistener('click', function() {
    console.log('Button clicked');
  });
 
  
  function processArray(arr, callback) {
    for (let i = 0; i < arr.length; i++) {
      callback(arr[i]);
    }
  }
  processArray([1, 2, 3], function(item) {
    console.log(item);
  });
