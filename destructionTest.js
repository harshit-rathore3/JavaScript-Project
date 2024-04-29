
function createUser(req, res) {
  const { name, email, age } = req.body;
  // Create a new user with the provided data
  // ...
}

function getUserAddress(user) {
  const { street, city, country } = user.address;
  // Return the user's address details
  return { street, city, country };
}

function getUserProperty(user, propertyName) {
  // Return the value of the specified property for the given user
  return user[propertyName];
}

function getProductDetails(product) {
  const name = product.name || 'Unknown';
  const price = product.price || 0;
  const category = product.category || 'Uncategorized';
  // Return the product details
  return { name, price, category };
}

function logUserDetails(user) {
  console.log('Name:', user.name);
  console.log('Email:', user.email);
  console.log('Other details:', { age: user.age, address: user.address });
  // Log the user's details to the console
}
