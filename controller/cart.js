const productsDB = require("../model/Products");
const CartDB = require("../model/Cart");
const FreeSampleCart = require("../model/FreeSampleCart");

// POST '/api/cart'
exports.createCart = async (req, res) => {
  const {
    productId,
    quantity,
    deviceId,
    selectedServices,
    selectedAccessories,
  } = req.body;

  // //console.log("selectedServices", selectedServices)
  // Ensure each accessory has a quantity of 1 if not provided
  const updatedAccessories = selectedAccessories?.map((accessory) => {
    if (!accessory.quantity) {
      accessory.quantity = 1;
    }
    return accessory;
  });

  try {
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories")
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    const item = await productsDB.findOne({ _id: productId });

    if (!item) {
      res.status(404).send({ message: "item not found" });
      return;
    }

    const price = item.specialprice?.price || item.discountedprice?.price ||  item.perUnitPrice;
    const name = item.productTitle;

    if (cart) {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId._id.toString() === productId
      );

      if (itemIndex > -1) {
        let product = cart.items[itemIndex];
        product.quantity += quantity;
        product.selectedServices = selectedServices || [];
        product.selectedAccessories = updatedAccessories || [];

        cart.bill = cart.items.reduce((acc, curr) => {
          return acc + curr.quantity * curr.price;
        }, 0);

        cart.items[itemIndex] = product;
        await cart.save();
        await cart.populate({
          path: "items.productId",
          select:
            "productId productTitle price images category subcategory perUnitPrice totalPrice",
        });
        await cart.populate({
          path: "items.selectedAccessories",
        });
        await cart.populate({
          path: "freeSamples",
          select:
            "productId productTitle price images category subcategory perUnitPrice totalPrice",
        });
        res.status(200).send(cart);
      } else {
        cart.items.push({
          productId,
          name,
          quantity,
          price,
          selectedServices,
          selectedAccessories: updatedAccessories,
        });
        cart.bill = cart.items.reduce((acc, curr) => {
          return acc + curr.quantity * curr.price;
        }, 0);

        await cart.save();
        await cart.populate({
          path: "items.productId",
          select:
            "productId productTitle price images category subcategory perUnitPrice totalPrice",
        });
        await cart.populate({
          path: "items.selectedAccessories",
        });
        await cart.populate({
          path: "freeSamples",
          select:
            "productId productTitle price images category subcategory perUnitPrice totalPrice",
        });
        res.status(200).send(cart);
      }
    } else {
      const newCart = await CartDB.create({
        owner: deviceId,
        items: [
          {
            productId,
            name,
            quantity,
            price,
            selectedServices,
            selectedAccessories: updatedAccessories,
          },
        ],
        bill: price,
      });

      await newCart.populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      });

      await newCart.populate({
        path: "items.selectedAccessories",
      });
      await cart.populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      });

      return res.status(201).send(newCart);
    }
  } catch (error) {
    // //console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// PUT: 'api/cart'
exports.updateCartItemQuantity = async (req, res) => {
  const { productId, quantity, deviceId } = req.body;

  //console.log("Upodate running");

  try {
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories")
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    if (!cart) {
      res.status(404).send({ message: "Cart not found" });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId._id == productId
    );

    if (itemIndex === -1) {
      res.status(404).send({ message: "Item not found in the cart" });
      return;
    }

    // Update the quantity of the item
    cart.items[itemIndex].quantity = quantity;

    // Recalculate the total bill
    cart.bill = cart.items.reduce((acc, curr) => {
      return acc + curr.quantity * curr.price;
    }, 0);

    // Save the updated cart
    await cart.save();

    res.status(200).send(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// GET: 'api/cart'
// const CartDB = require('../model/Cart');

// const CartDB = require('../model/Cart');

exports.getCart = async (req, res) => {
  const { deviceId } = req.query;

  try {
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories") // Populate selectedAccessories within each item
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    res.status(200).send(cart);
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const { owner, productId } = req.query;
    // //console.log(req.query);

    // //console.log("run deleted")

    //console.log(owner, productId);
    const cart = await CartDB.findOne({ owner: owner })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories") // Populate selectedAccessories within each item
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    // //console.log(cart)

    // Check if the cart exists
    if (!cart) {
      return res.status(404).json({ error: "Cart not found" });
    }

    // Find the index of the product in the items array
    const productIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    // //console.log(productIndex)

    // Check if the product exists in the cart
    if (productIndex === -1) {
      return res.status(404).json({ error: "Product not found in the cart" });
    }

    // Get the price and quantity of the product being removed
    const removedProductPrice = cart.items[productIndex].price;
    const removedProductQuantity = cart.items[productIndex].quantity;

    // Update the bill by subtracting the removed product price multiplied by its quantity
    cart.bill -= removedProductPrice * removedProductQuantity;

    // Remove the product from the items array
    cart.items.splice(productIndex, 1);

    // Save the updated cart
    await cart.save();

    // Return the updated cart
    res.json(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.increaseServiceQuantity = async (req, res) => {
  const { deviceId, productId, serviceId, quantity } = req.body;

  try {
    // Find the cart by deviceId
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories") // Populate selectedAccessories within each item
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    // Find the index of the product in the cart
    const productIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).send({ message: "Product not found in the cart" });
    }

    // Find the index of the service in the product's selectedServices array
    const serviceIndex = cart.items[productIndex].selectedServices.findIndex(
      (service) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res
        .status(404)
        .send({ message: "Service not found in the product" });
    }

    // Update the quantity of the service
    cart.items[productIndex].selectedServices[serviceIndex].quantity = quantity;

    // Recalculate the total bill
    cart.bill = cart.items.reduce((acc, curr) => {
      const servicesCost = curr.selectedServices.reduce(
        (serviceAcc, service) => {
          return serviceAcc + service.cost * service.quantity;
        },
        0
      );
      return acc + curr.quantity * curr.price + servicesCost;
    }, 0);

    // Save the updated cart
    await cart.save();

    // Send the updated cart in the response
    res.status(200).send(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addServicesToProduct = async (req, res) => {
  const { deviceId, productId, selectedServices } = req.body;

  //console.log("selectedServices",selectedServices)

  try {
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories")
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    const productIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).send({ message: "Product not found in the cart" });
    }

    cart.items[productIndex].selectedServices = selectedServices;

    cart.bill = cart.items.reduce((acc, curr) => {
      const servicesCost = curr.selectedServices.reduce((serviceAcc, service) => {
        return serviceAcc + service.cost * service.quantity;
      }, 0);
      return acc + curr.quantity * curr.price + servicesCost;
    }, 0);

    await cart.save();

    res.status(200).send(cart);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }

};

exports.deleteServiceFromProduct = async (req, res) => {
  try{
    const { deviceId, productId, serviceId } = req.body;
    //console.log(deviceId)
    //console.log(req.body)
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories")
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    const productIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );
    //console.log(productIndex)
    if (productIndex === -1) {
      return res.status(404).send({ message: "Product not found in the cart" });
    }

    const serviceIndex = cart.items[productIndex].selectedServices.findIndex(
      (service) => service._id.toString() === serviceId
    );

    if (serviceIndex === -1) {
      return res.status(404).send({ message: "Service not found in the product" });
    }

    cart.items[productIndex].selectedServices.splice(serviceIndex, 1);

    cart.bill = cart.items.reduce((acc, curr) => {
      const servicesCost = curr.selectedServices.reduce((serviceAcc, service) => {
        return serviceAcc + service.cost * service.quantity;
      }, 0);
      return acc + curr.quantity * curr.price + servicesCost;
    }, 0);

    await cart.save();
    //console.log(cart)
    res.status(200).send(cart);
} catch (error) {
  console.error(error);
  res.status(500).json({ message: error.message });
}
};

exports.increaseAccessoriesQuantity = async (req, res) => {
  const { deviceId, productId, accessoryId, quantity } = req.body;

  try {
    // Find the cart by deviceId
    const cart = await CartDB.findOne({ owner: deviceId })
      .populate({
        path: "items.productId",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .populate("items.selectedAccessories")
      .populate({
        path: "freeSamples",
        select:
          "productId productTitle price images category subcategory perUnitPrice totalPrice",
      })
      .exec();

    if (!cart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    // Find the index of the product in the cart
    const productIndex = cart.items.findIndex(
      (item) => item.productId._id.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).send({ message: "Product not found in the cart" });
    }

    const accessoryIndex = cart.items[
      productIndex
    ].selectedAccessories.findIndex(
      (accessory) => accessory._id.toString() === accessoryId
    );

    if (accessoryIndex === -1) {
      return res
        .status(404)
        .send({ message: "Accessory not found in the product" });
    }

    cart.items[productIndex].selectedAccessories[accessoryIndex].quantity =
      quantity;

    // //console.log(cart.items[productIndex].selectedAccessories[accessoryIndex].quantity)

    cart.bill = cart.items.reduce((acc, curr) => {
      const itemTotal = curr.quantity * (curr.price || 0);
      const accessoriesTotal = curr.selectedAccessories.reduce(
        (acc, accessory) => {
          return acc + (accessory.cost * accessory.quantity || 0);
        },
        0
      );
      return acc + itemTotal + accessoriesTotal;
    }, 0);

    if (isNaN(cart.bill)) {
      throw new Error("Calculated bill is NaN");
    }

    // Save the updated cart
    await cart.save();

    // Log the updated selectedAccessories to verify
    //console.log(cart.items[productIndex].selectedAccessories);

    res.status(200).send(cart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getFreeSamples = async (req, res) => {
  const { deviceId } = req.query;

  try {
    const freeSampleCart = await FreeSampleCart.findOne({ owner: deviceId })
      .populate("products")
      .exec();

    return res.status(200).send(freeSampleCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.addFreeSample = async (req, res) => {
  const { deviceId, freeSampleIds } = req.body; // Accept an array of sample IDs

  try {
    const freeSampleCart = await FreeSampleCart.findOne({ owner: deviceId })
      .populate("products")
      .exec();

    if (!freeSampleCart) {
      const newFreeSampleCart = await FreeSampleCart.create({
        owner: deviceId,
        products: freeSampleIds?.map((id) => id) || [],
      });

      await newFreeSampleCart.save();

      await newFreeSampleCart.populate("products");

      return res.status(201).send(newFreeSampleCart);
    }

    // Filter out already existing free samples
    const newFreeSampleIds = freeSampleIds?.filter((id) => {
      return !freeSampleCart.products.some((item) => {
        return item._id.toString() === id;
      });
    });

    if (newFreeSampleIds?.length === 0) {
      return res.status(200).send({
        message: "All selected free samples are already added to the list",
      });
    }

    newFreeSampleIds.forEach((id) => {
      freeSampleCart.products.push(id);
    });

    await freeSampleCart.save();

    res.status(200).send(freeSampleCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteFreeSample = async (req, res) => {
  const { deviceId, freeSampleId } = req.body;

  try {
    const freeSampleCart = await FreeSampleCart.findOne({ owner: deviceId })
      .populate("products")
      .exec();

    if (!freeSampleCart) {
      return res.status(404).send({ message: "Cart not found" });
    }

    if (!freeSampleId) {
      return res.status(400).send({ message: "Free sample ID is required" });
    }

    const updatedCart = await FreeSampleCart.findOneAndUpdate(
      { owner: deviceId },
      {
        $pull: { products: freeSampleId },
      },
      {
        new: true,
      }
    );

    res.status(200).send(updatedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
