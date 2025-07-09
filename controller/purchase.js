const purchasedb = require("../model/Purchase");
const userdb = require("../model/User");

exports.storePurchase = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    if (!orderId)
      return res.status(400).json({ message: "Please provide orderId" });

    //if the customer is a guest user, userId can be null
    //otherwise it would be a string id referring to one user in the db
    //store details in the purchasedb
    const purchase = new purchasedb({
      userId: userId ? userId : null,
      orderId: orderId,
      userType: userId ? "member" : "guest",
    });

    await purchase.save();

    if (userId)
      //now insert this into thhe user purchase record
      await userdb.findByIdAndUpdate(
        { _id: userId },
        { $push: { purchases: purchase._id } }
      );

    return res.status(200).json("Purchase details saved");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
