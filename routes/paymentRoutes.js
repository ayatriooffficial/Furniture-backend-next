const paymentRoutes = require('express').Router();
const Razorpay = require("razorpay");
const crypto = require('crypto');
const ProductSchema = require('../model/Products');

paymentRoutes.post("/orders", async (req, res) => {
	try {
		const instance = new Razorpay({
			key_id: process.env.RAZOR_PAY_KEY_ID,
			key_secret: process.env.RAZOR_PAY_KEY_SECRET,
		}); 
		//console.log(req.body)
		const { orderValue } = req.body;
		const orderAmount = parseInt(orderValue);
		if (orderAmount < 1.00) {
			return res.status(400).json({ message: 'The amount must be at least 1.00 INR' });
		}
		//console.log(orderAmount)
        // //console.log("order value:", orderValue);

		const options = {
			amount: orderAmount * 100,
			currency: "INR",
			receipt: crypto.randomBytes(10).toString("hex"),
		};

		instance.orders.create(options, (error, order) => {
			if (error) {
				//console.log(error);
				return res.status(500).json({ message: "Something Went Wrong!" });
			}
			res.status(200).json({ data: order });
		});
	} catch (error) {
		res.status(500).json({ message: "Internal Server Error!" });
		//console.log(error);
	}
});

paymentRoutes.post("/verify", async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
			req.body;
		//console.log(req.body)
		const sign = razorpay_order_id + "|" + razorpay_payment_id;
		const expectedSign = crypto
			.createHmac("sha256", process.env.RAZOR_PAY_KEY_SECRET)
			.update(sign.toString())
			.digest("hex");

		if (razorpay_signature === expectedSign) {
			// //console.log("update the order schema here")

			return res.status(200).json({ message: "Payment verified successfully",paymentSuccess:true });
		} else {
			return res.status(400).json({ message: "Invalid signature sent!",paymentSuccess:false });
		}
	} catch (error) {
		res.status(500).json({ message: "Internal Server Error!",paymentSuccess:false });
		//console.log(error);
	}
});

module.exports = paymentRoutes;