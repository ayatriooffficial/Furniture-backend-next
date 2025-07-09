const { default: axios } = require("axios");
const crypto = require("crypto");
const Order = require("../model/Order");
const {
  sendOrderConfirmationEmail,
  sendFreeSampleRequestEmail,
} = require("./sendmail");
const CartDB = require("../model/Cart");
const FreeSampleCart = require("../model/FreeSampleCart");
const ExternalOffer = require("../model/ExternalOffer");
const Purchase = require("../model/Purchase"); // Correct import

exports.makePayment = async (req, res) => {
  try {
    console.log("Make Pay is called now", req.body);
    const {
      amount,
      callbackUrl,
      bankId,
      otherExternalOffersDiscount,
      deliveryPrice,
      redirectUrl,
    } = req.body;

    if (!amount || !callbackUrl || !redirectUrl) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials are missing");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const transactionId = crypto.randomUUID();
    let discountAmt = amount - (deliveryPrice || 0);

    if (bankId) {
      const applicableOffer = await ExternalOffer.findOne({
        type: "bank",
        name: bankId,
      });
      if (applicableOffer) {
        const currentDate = new Date();
        const endDate = new Date(applicableOffer.endDate);
        const startDate = new Date(applicableOffer.startDate);
        const isAmtGreaterThanMinPurchase =
          +applicableOffer.minimumPurchase <= discountAmt;
        const isPeriodApplicable =
          startDate < currentDate && currentDate < endDate;

        if (isAmtGreaterThanMinPurchase && isPeriodApplicable) {
          if (applicableOffer.discountType === "percentage") {
            discountAmt -= (discountAmt * applicableOffer.discountValue) / 100;
          } else if (applicableOffer.discountType === "fixed") {
            discountAmt -= applicableOffer.discountValue;
          }
        }
      }
    }

    discountAmt += deliveryPrice || 0;
    discountAmt = Math.max(1, discountAmt - (otherExternalOffersDiscount || 0));
    console.log("Discounted Amount:", discountAmt);

    const payload = {
      amount: Math.round(discountAmt * 100),
      currency: "INR",
      receipt: transactionId,
      notes: {
        merchantUserId: "MUI123",
      },
    };
    console.log("Razorpay payload:", payload);

    const response = await axios({
      method: "POST",
      url: "https://api.razorpay.com/v1/orders",
      auth: {
        username: keyId,
        password: keySecret,
      },
      headers: {
        "Content-Type": "application/json",
      },
      data: payload,
    }).catch((error) => {
      console.error("Razorpay API error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    });

    console.log("Razorpay response:", response.data);
    res.status(200).json({
      data: {
        orderId: response.data.id,
        amount: response.data.amount,
        currency: response.data.currency,
        key: keyId,
        callbackUrl: redirectUrl,
      },
    });
  } catch (error) {
    console.error("Error in makePayment:", error.message, error.stack);
    res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

exports.paymentCallback = async (req, res) => {
  try {
    console.log("paymentCallback called with:", {
      params: req.params,
      body: req.body,
    });
    const { orderId } = req.params;
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    // Validate inputs
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      console.log("Missing Razorpay parameters");
      return res.status(400).json({ message: "Missing Razorpay parameters" });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      console.log("Order not found:", orderId);
      return res.status(404).json({ message: "Order not found" });
    }
    console.log("Order found:", order);

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET is missing");
      return res.status(500).json({ message: "Server configuration error" });
    }
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");
    console.log("Signatures:", { generated: generatedSignature, received: razorpay_signature });

    if (generatedSignature !== razorpay_signature) {
      console.log("Signature verification failed");
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Check if order is already processed
    if (order.payment && order.paymentStatus === "SUCCESS") {
      console.log("Order already processed:", orderId);
      return res.status(200).json({
        message: "Payment already processed",
        isFreeSample: order.isFreeSample,
      });
    }

    // Update order
    order.payment = true;
    order.paymentStatus = "SUCCESS";
    order.transactionId = razorpay_payment_id;
    await order.save();
    console.log("Order updated:", orderId);

    // Handle external offer
    let externalOffer = null;
    if (order?.amount?.discount > 0 && order.bankId) {
      externalOffer = await ExternalOffer.findOne({ bankId: order.bankId });
      console.log("External offer:", externalOffer || "None");
    }

    // Check for existing Purchase
    const existingPurchase = await Purchase.findOne({ orderId: order._id });
    if (existingPurchase) {
      console.log("Purchase already exists:", existingPurchase._id);
    } else {
      // Create Purchase record
      const purchase = new Purchase({
        orderId: order._id,
        paymentId: razorpay_payment_id,
        userId: order.userId,
        userType: order.userId ? "member" : "guest",
      });
      await purchase.save();
      console.log("Purchase created:", purchase._id);
    }

    // Clear cart if not free sample
    if (!order.isFreeSample && order.cartId) {
      const cart = await CartDB.findById(order.cartId);
      if (cart) {
        cart.items = [];
        cart.bill = 0;
        await cart.save();
        console.log("Cart cleared:", order.cartId);
      } else {
        console.log("Cart not found:", order.cartId);
      }
    }

    // Send email
    const email = externalOffer?.email || order.address.email;
    try {
      if (!order.isFreeSample) {
        await sendOrderConfirmationEmail({
          email,
          orderId: order._id,
          amount: order.amount,
          cart: order.items || [],
          address: order.address,
        });
        console.log("Order confirmation email sent");
      } else {
        await sendFreeSampleRequestEmail({
          email,
          orderId: order._id,
          amount: order.amount,
          cart: order.items || [],
          address: order.address,
        });
        console.log("Free sample email sent");
      }
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // Continue despite email failure
    }

    console.log("Everything works great in payment callback");
    return res.status(200).json({
      message: "Payment successful",
      isFreeSample: order.isFreeSample,
    });
  } catch (error) {
    console.error("Error in paymentCallback:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      body: req.body,
    });
    return res.status(500).json({ message: error.message || "Internal Server Error" });
  }
};

module.exports = {
  makePayment: exports.makePayment,
  paymentCallback: exports.paymentCallback,
};