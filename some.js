
function calculate(type, n) {
    switch(type) {
        case 'factorial':
            return factorial(n);
        case 'prime':
            return isPrime(n);
        default:
            return 'Invalid calculation type. Please choose "factorial" or "prime".';
    }
}

function factorial(n) {
    return (n === 0 || n === 1) ? 1 : n * factorial(n - 1);
}

function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    let i = 5;
    while (i * i <= n) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
        i += 6;
    }
    return true;
}

// Example usage:
console.log(calculate('factorial', 5)); // Output: 120
console.log(calculate('prime', 11)); // Output: true
