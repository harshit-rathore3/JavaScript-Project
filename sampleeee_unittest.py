
# Necessary Imports
import pytest
from your_module import is_prime, factorial

# Test cases generated
def test_is_prime():
    # Test case for the is_prime function with prime number
    assert is_prime(7) == True

    # Test case for the is_prime function with non-prime number
    assert is_prime(4) == False

    # Test case for the is_prime function with number less than or equal to 1
    assert is_prime(1) == False

def test_factorial():
    # Test case for the factorial function with non-zero number
    assert factorial(5) == 120

    # Test case for the factorial function with zero
    assert factorial(0) == 1
