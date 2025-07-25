const OrderDB = require("../model/Order");
const nodemailer = require("nodemailer");
const CartDB = require("../model/Cart");
const {
  sendOrderConfirmationEmail,
  sendFreeSampleRequestEmail,
} = require("./sendmail");

const FreeSampleCart = require("../model/FreeSampleCart");
const BaseUrl = process.env.BASE_URL || "https://www.ayatrio.com";
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const orders = await OrderDB.findById(orderId);
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkout = async (req, res) => {
  const deviceId = req.body.deviceId;
  const productId = req.body.productId;

  // if user is logged, otherwise it's fine
  const userId = req.body.googleId;

  if (!deviceId || !productId) {
    return res.status(400).json({ error: "Invalid request" });
  }

  if (!userId) {
    return res.status(404).json({ error: "User not found" });
  }

  const selectedProducts = await productsDB.findOne({ productId });
  // const userProducts = userDeviceMap[deviceId];
  //console.log(selectedProducts);

  // Calculate total price
  const totalPrice = selectedProducts.price + 50; // delivery charge
  //console.log(totalPrice);

  // more logic here (e.g., payment processing, order creation, etc.)

  res.json({ success: true, total: totalPrice });
  res.redirect()
};

// Helper function to calculate subtotal
function calculateSubtotal(products) {
  // Fetch product prices from database and calculate subtotal
  // For simplicity, let's assume each product has a fixed price
  const productPrices = {
    productId1: 10,
    productId2: 20,
    // Add more as needed
  };

  return products.reduce((subtotal, { productId, quantity }) => {
    return subtotal + productPrices[productId] * quantity;
  }, 0);
}

exports.order = async (req, res) => {
  const { deviceId, cartId, address, isFreeSample, freeSampleCartId, amount, userId } = req.body;

  try {
    if (isFreeSample) {
      if (!freeSampleCartId) {
        return res.status(400).json({ message: "Invalid request" });
      }
  
      const order = new OrderDB({
        deviceId,
        isFreeSample,
        freeSampleCartId,
        address,
        amount,
        userId
      });

      await order.save();

      // const freeSampleCartProducts = await FreeSampleCart.findById(order.freeSampleCartId).populate({
      //   path: "products",
      //   select:
      //     "productDescription productTitle  images specialprice discountedprice perUnitPrice ",
      // }).select('products');

      // const products = freeSampleCartProducts.products.map((item) => {
      //   const price =
      //     item.specialprice.price ||
      //     item.perUnitPrice;
      //   return {
      //     productTitle: item.productTitle,
      //     productDescription: item.productDescription,
      //     images: item.images,
      //     price: price,
      //   };
      // });
      // await sendFreeSampleRequestEmail(order, products);

      return res.status(200).json({
        orderId: order._id.toString(),
        message: "Order details saved!",
      });
    }

    const cartProducts = await CartDB.findById(cartId);

    const orderInstance = new OrderDB({
      deviceId,
      cartId,
      items: cartProducts.items,
      address,
      amount,
      userId
    });
    await orderInstance.save();
    // const cartProducts = await CartDB.findById(cartId)
    //   .populate({
    //     path: "items.productId",
    //     select:
    //       "productDescription productTitle  images specialprice discountedprice perUnitPrice ",
    //   })
    //   .select("items.productId");

    // const products = cartProducts.items.map((item) => {
    //   const price =
    //     item.productId.specialprice.price ||
    //     item.productId.perUnitPrice;
    //   return {
    //     productTitle: item.productId.productTitle,
    //     productDescription: item.productId.productDescription,
    //     images: item.productId.images,
    //     price: price,
    //     quantity: item.quantity,
    //   };
    // });

    // await sendOrderConfirmationEmail(orderInstance, products);

    res.status(200).json({
      message: "Order details saved!",
      orderId: orderInstance._id.toString(),
    });
  } catch (error) {
    //console.log(error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { deviceId, payment } = req.body;

    const order = await OrderDB.findOne({ deviceId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.payment = payment;
    await order.save();

    res.status(200).json({ message: "Order updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
