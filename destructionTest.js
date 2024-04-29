function createUser(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const age = req.bo.age;

  }


  function getUserAddress(user) {
    const street = user.address.street;
    const city = user.address.city;
    const country = user.address.country;

  }
//errors,return
  functin getUserProperty(user, propertyName) {
    retur user[propertyName];
  }



  
  function getProductDetails(product) {
    const name = prod.name || 'Unknown';
    const price = product.price || 0;
    const category = product.cat || 'Uncategorized';

  }

  function logUserDetails(user) {
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Other details:', {
      age: user.age,
      address: user.address,
    });
  }
