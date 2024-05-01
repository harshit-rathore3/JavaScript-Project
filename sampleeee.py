
def is_prime(n):
    """
    Determines if a given number is prime.

    Args:
        n (int): The number to check for primality.

    Returns:
        bool: True if the number is prime, False otherwise.
    """
    if n <= 1:
        return False
    elif n <= 3:
        return True
    elif n % 2 == 0 or n % 3 == 0:
        return False

    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6

    return True


def factorial(n):
    """
    Calculates the factorial of a given number.

    Args:
        n (int): The number to calculate the factorial for.

    Returns:
        int: The factorial of the given number.
    """
    if n == 0:
        return 1
    else:
        return n * factorial(n - 1)
