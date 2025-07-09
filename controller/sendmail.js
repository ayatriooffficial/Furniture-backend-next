const nodemailer = require("nodemailer");
const User = require("../model/User"); // Import your User model
// Set up nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Function to send email to user
async function sendEmailToUser(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.emailSent) {
      const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: user.email,
        subject: "Welcome to Ayatrio",
        html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ayatrio Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 10px 0;

        }


        .container {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            background-color: #ffffff;
        }

        .header,
        .footer,
        .logo {
            text-align: center;
            padding: 10px;
        }

        .footer {
            margin-top: 40px;
        }

         a {
            text-decoration: none;
            color: black
        }

        .footer span {
            margin: 0 2px;
        }

        .header p {
            margin-left: 30px;
            margin-right: 30px;
            font-size: 14px;
            line-height: 1.3;
            color: #666666;
        }

        .content {
            padding: 20px;
        }

        .content-item {
            margin: 10px auto;
            width: 100%;
            max-width: 400px;

            display: flex;
        }

        .content-item h3 {
            margin: 0 10px;
        }

        .content-item p {
            margin: 10px;
        }

        h1 {
            color: #333333;
            text-align: center;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            background-color: #28a745;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
        }

        .icon {
            margin-right: 20px;
            width: 40px;
            height: 40px;
            vertical-align: middle;
        }


        .borderbox {
            border: 1.5px solid black;
            margin: 10px;
            font-size: 10px;
        }



        @media (max-width: 600px) {

            .content {
                padding: 30px;
            }

            h1 {
                font-size: 24px;
            }

            .header p {
                margin-left: 10px;
                margin-right: 10px;
                font-size: 14px;
            }


            p {
                font-size: 10px;
            }

            .button {
                padding: 8px 16px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div class="logo">
          <a href="https://www.ayatrio.com/"><img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124360_subCategoriesImage_ayatriologo.png"
                alt="" /> </a>
        </div>
        <div class="header">
            <h1>Together, We can Create Future of Home Furnishing</h1>
            <p>Welcome to Ayatrio. Your Ayatrio Family Member benefits start immediately to start your personalized Home
                Furnishing to access the best Ayatrio product, inspiration, and community.</p>
        </div>

        <div class="content">
            <div class="content-item" style="display: flex; ">

                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124359_subCategoriesImage_live.png"
                    alt="Group 1" height="40" width="40" class="icon"/>
                <!-- <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124357_image_store.png" alt="Group 1" height="40" width="40" /> -->

                <div class="content-item-text">
                    <h3>Shop LIVE with a Specialist</h3>
                    <p>Let us guide you live over video and answer all
                        of your questions with the expert from
                        nearby Ayatrio stores.</p>
                </div>
            </div>
            <div class="content-item" style="display: flex; ">
                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124455_subCategoriesImage_60.png"
                    alt="Group 1" height="40" width="40" class="icon"/>
                <div class="content-item-text">
                    <h3>60 Day trial with home products</h3>
                    <p>60 days on a trial period, if you feel our product
                        not able to keep up dream, we will give
                        you back your money.</p>
                </div>
            </div>
            <div class="content-item" style="display: flex; ">
                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124456_subCategoriesImage_3.png"
                    alt="Group 1" height="40" width="40" class="icon"/>
                <div class="content-item-text">
                    <h3> 3 Free Service a year</h3>
                    <p> 3 free technical and maintenance service a
                        year to all AyatrioCare+ home products.</p>
                </div>
            </div>


            <div class="content-item" style="display: flex; ">
                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124360_subCategoriesImage_shipping.png"
                    alt="Group 1" height="40" width="40" class="icon"/>
                <div class="content-item-text">
                    <h3>Free installation & Free Shipping</h3>
                    <p> As a ayatrio member install any ayatrio
                        product free and Shipping </p>
                </div>
            </div>

            <div class="content-item" style="display: flex; ">
                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124359_subCategoriesImage_emi.png"
                    alt="Group 1" height="40" width="40" class="icon"/>
                <div class="content-item-text">
                    <h3>Paying over Zero Cost-EMI</h3>
                    <p> Finance never be obstacles to decorate your room,
                        we help you make simple and easy</p>
                </div>
            </div>

            <div class="content-item" style="display: flex; ">
                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124359_subCategoriesImage_furnishing.png"
                    alt="Group 1" height="40" width="40" class="icon"/>
                <div class="content-item-text">
                    <h3> Design your room live with Experts</h3>
                    <p> With Ayatrio LIVE share you dream home what
                        could be with the world top experience designing team.</p>
                </div>
            </div>
        </div>
        <div class="borderbox">
            <h1><a href="https://www.ayatrio.com/">Shop now with Ayatrio Family Member</a></h1>
        </div>
        <div class="content">
            <h1>SHOP IN-STORE</h1>
            <div class="content-item" style="display: flex; ">

                <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124357_image_store.png"
                    alt="Group 1" height="40" width="40" class="icon"/>

                <div class="content-item-text">
                    <h3> Find a Store Near You</h3>
                    <p> Use our store locator to access your
                        local Ayatrio Family Members.</p>
                </div>
            </div>
        </div>

        <div class="borderbox">
            <h1><a href="https://www.ayatrio.com/ayatrio-map"> Find Your Store </a></h1>
        </div>

        <div <div class="footer">
            <a href="https://www.ayatrio.com/"> <img
                    src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124360_subCategoriesImage_ayatriologotext.png"
                    alt="Group 1" /> </a>
            <h4>
                <a href="https://www.ayatrio.com/Wallpaper/category/all"><span>Wallpaper</span></a>
                <span> &#x2022;</span>
                <a href="https://www.ayatrio.com/flooring/category/all"><span>Flooring</span></a>
                <span> &#x2022;</span>
                <a href="https://www.ayatrio.com/curtain/category/all"><span>Curtain</span></a>
                <span> &#x2022;</span>
                <a href="https://www.ayatrio.com/blinds/category/all"><span>Blinds</span></a>
            </h4>
        </div>
    </div>
</body>

</html>`,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);

      user.emailSent = true;
      await user.save();
    }
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function sendEmailForProductRequest(email, productName) {
  console.log(email);
  try {
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: "You have requested a product",
      html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ayatrio</title>
</head>

<body style="font-family: Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box;">
    <header style="background-color: #fff; text-align: center; padding: 20px 0; border-bottom: 1px solid #ddd;">
        <h1>AYATRIO</h1>
    </header>

    <section style="background-color: #fafafa; padding: 20px; text-align: center;">
        <div style="margin-bottom: 20px;">
            
        </div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 20px;">
            <img src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1717414274457_desktopImgSrc_ayatriologo.png" alt="Ayatrio home" style="max-width: 100%; margin: 10px;" width="300" height="87">
        </div>
    </section>

    <section style="padding: 20px; text-align: center;">
        <h2>You have successfully requested for ${productName}.</h2>
    </section>

    <section style="padding: 2px; text-align: center;">
        <h2>SHOP IN-STORE</h2>
        <p>Find a Store Near You</p>
        <button
        style="width: 100%; max-width: 1200px; background-color: #fff; color: #000; padding: 20px; border: 1px solid #000; cursor: pointer; font-size: 16px; font-weight: bold; text-transform: uppercase; text-align: center; box-sizing: border-box;">    
            FIND YOUR STORE
        </button>
    </section>

    <footer style="background-color: #fff; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
        <a href="https://www.ayatrio.com/"><p>AYATRIO.COM</p></a>
        <ul style="list-style-type: none; padding: 0; display: flex; justify-content: center; margin-top: 10px;">
            <li style="margin: 0 10px;"><a href="#" style="text-decoration: none; color: #000;">Home Decor</a></li>
            <li style="margin: 0 10px;"><a href="#" style="text-decoration: none; color: #000;">Wall Decor</a></li>
            <li style="margin: 0 10px;"><a href="#" style="text-decoration: none; color: #000;">Flooring</a></li>
            <li style="margin: 0 10px;"><a href="#" style="text-decoration: none; color: #000;">Offers</a></li>
        </ul>
    </footer>
</body>

</html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error; // Re-throw the error for the caller to handle
  }
}

async function sendOrderConfirmationEmail(order, products) {
  let productHtml = "";
  products.forEach((product) => {
    productHtml += `<div  style="margin: 10px auto; display: flex; max-width: 400px; width: 100%; ">
    <a  href="https://www.ayatrio.com/${product.productTitle}"><img src=${
      product.images[0]
    }
              alt="" height="150" width="150"  /></a>
          <div style="margin-left: 20px;>
              <h3 style="margin: 0 0 5px 0;">${product.productTitle}</h3>
              <p style="margin: 0 0 5px 0; "> ${
                product.productDescription.slice(0, 100) + "..."
              }</p>
              <p
                  style="margin: 0 0 5px 0; background-color: #FFD209;  font-weight: 600; line-height: 0.5; display: flex; padding: 0.75rem 0.5rem 0.25rem 0.5rem; width: fit-content;  font-size: 1.875rem; line-height: 2.25rem; box-shadow: 3px 3px #C31952;" >
                  <span style="font-size: 14px;">Rs.</span>${product.price}</p>
          </div>
      </div>`;
  });
  try {
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: order.address.email,
      subject: "Order Confirmation",
      html: `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ayatrio Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 10px 0;

        }

        .container {
            width: 100%;
            max-width: 700px;
            margin: 0 auto;
            background-color: #ffffff;
        }

        .header,
        .footer {
            text-align: center;
            padding: 10px;
        }

        .footer {
            margin-top: 40px;
        }

        .footer a {
            text-decoration: none;
            color: black
        }

        .footer span {
            margin: 0 2px;
        }

        .header h4 {
            margin-left: 30px;
            margin-right: 30px;
            line-height: 1.3;
            color: blue;
        }

        .content {
            padding: 10px;
            display: flex;
        }

        .content-item {
            width: 100%;
            max-width: 400px;
            margin: 10px;
            /* display: flex; */
        }


        .content-item h5 {
            margin: 0;
            font-size: 14px;
        }

        .content-item p {
            /* margin: 0; */
            font-size: 14px;
            /* margin: 10px; */
            clear: both;
            overflow: auto;
            margin: 20px 0;
        }

        h1 {
            color: #333333;
            text-align: center;
        }

        .button {
            display: inline-block;
            padding: 10px 20px;
            margin: 10px 0;
            background-color: #28a745;
            color: #ffffff;
            text-decoration: none;
            border-radius: 5px;
        }

        .icon {
            margin-right: 20px;
            width: 40px;
            height: 40px;
            vertical-align: middle;
        }


        .borderbox {
            border: 1.5px solid black;
            margin: 10px;
            font-size: 10px;
        }



        @media (max-width: 600px) {

            .content {
                padding: 30px;
            }

            h1 {
                font-size: 24px;
            }

            .header p {
                margin-left: 10px;
                margin-right: 10px;
                font-size: 14px;
            }

            .content {
                display: block;
            }

            .content-item {
                width: 100%;
                max-width: 100%;
                margin: 10px 0 ;
                /* display: flex; */
            }

            p {
                font-size: 10px;
            }

            .button {
                padding: 8px 16px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <div style="padding: 10px 0; width:100%;">
            <a style="float:left;" class="left" href="https://www.ayatrio.com/"><img
                    src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721286553198_desktopImgSrc_ayatriologo.png"
                    alt="" width="40" height="40" /> </a>
            <a style="float:right;" href="https://www.ayatrio.com/"><img
                    src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721286553199_mobileImgSrc_addtocart.png"
                    alt="" width="40" height="40" /> </a>
        </div>
        <div class="header" style="margin-top: 50px;">
            <h1> Thanks For Shopping
                at Ayatrio</h1>
            <h4>Order Number: ${order._id}</h4>
            <p> Hi Harsh,</p>
            <p> We have received your order and will send you a shipping
                confirmation with your & trace details as soon as your
                order ships</p>
            <p> If any details within your order are incorrect, please send us an
                email <a href="https://www.ayatrio.com/customerservice/contactus">Click here</a> or contact our customer
                service
                9836465083</p>
            <p>Your Ayatrio Team</p>
        </div>

        <h1 style="letter-spacing: 4px;"> ORDER SUMMARY</h1>
        <div class="content">
            <div class="content-item">
                <h5> Delivery Address</h5>
                <hr>
                <p style="margin: 0 0 5px 0;">${order.address.firstName} ${order.address.lastName}</p>
                <p style="margin: 0 0 5px 0;">${order.address.address}</p>
                <p style="margin: 0 0 5px 0;">${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}
                </p>
                <p style="margin: 0 0 5px 0;">${order.address.phone}</p>
            </div>
            <div class="content-item">
                <h5> Billing Information</h5>
                <hr>
                <p style="margin: 0 0 5px 0;">${order.address.firstName} ${order.address.lastName}</p>
                <p style="margin: 0 0 5px 0;">${order.address.address}</p>
                <p style="margin: 0 0 5px 0;">${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}
                </p>
                <p style="margin: 0 0 5px 0;">${order.address.phone}</p>
            </div>
            <div class="content-item">
                <h5> Order Summary</h5>
                <hr>
                <p><span style="float:left;">Products</span> <span
                        style="float:right;">${order.amount.productPrice}.00</span></p>
                <p><span style="float:left;">Delivery</span> <span style="float:right;">
                        ${order.amount.deliveryPrice}.00</span></p>
                <p style="margin-bottom: 0; font-size:20px; font-weight:bold;"><span style="float:left;">Total</span> <span style="float:right;">
                        ${order.amount.totalPrice}.00</span></p>
                <span style="font-size: 10px;">(Inclusive of tax)</span>
            </div>
        </div>
        <h1 style="letter-spacing: 4px;">WHAT YOU ORDERED</h1>
        <div style="width: 100%; display: block;">
            ${productHtml}
        </div>

        <div <div class="footer">
            <a href="https://www.ayatrio.com/"> <img
                    src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124360_subCategoriesImage_ayatriologotext.png"
                    alt="Group 1" /> </a>
            <h4>
                <a href="https://www.ayatrio.com/Wallpaper/category/all"><span>Wallpaper</span></a>
                <span> &#x2022;</span>
                <a href="https://www.ayatrio.com/flooring/category/all"><span>Flooring</span></a>
                <span> &#x2022;</span>
                <a href="https://www.ayatrio.com/curtain/category/all"><span>Curtain</span></a>
                <span> &#x2022;</span>
                <a href="https://www.ayatrio.com/blinds/category/all"><span>Blinds</span></a>
            </h4>
        </div>
    </div>
</body>

</html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

async function sendFreeSampleRequestEmail(order, products) {
  let productHtml = "";
  products.forEach((product) => {
    productHtml += `<div  style="margin: 10px auto; display: flex; max-width: 400px; width: 100%; padding: 0 10px 0 10px ">
      <a  href="https://www.ayatrio.com/${product.productTitle}"><img src=${
      product.images[0]
    }
                alt="" height="150" width="150" style="margin-right: 20px;" /></a>
            <div class="">
                <h3 style="margin: 0 0 5px 0;">${product.productTitle}</h3>
                <p style="margin: 0 0 5px 0; "> ${
                  product.productDescription.slice(0, 100) + "..."
                }</p>
                <p
                    style="margin: 0 0 5px 0; background-color: #FFD209;  font-weight: 600; line-height: 0.5; display: flex; padding: 0.75rem 0.5rem 0.25rem 0.5rem; width: fit-content;  font-size: 1.875rem; line-height: 2.25rem; box-shadow: 3px 3px #C31952;" >
                    <span style="font-size: 14px;">Rs.</span>${
                      product.price
                    }</p>
            </div>
        </div>`;
  });
  try {
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: order.address.email,
      subject: "Free Sample Requested Successfully",
      html: `<!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ayatrio Email</title>
      <style>
          body {
              font-family: Arial, sans-serif;
              padding: 10px 0;
  
          }
  
          .container {
              width: 100%;
              max-width: 700px;
              margin: 0 auto;
              background-color: #ffffff;
          }
  
          .header,
          .footer {
              text-align: center;
              padding: 10px;
          }
  
          .footer {
              margin-top: 40px;
          }
  
          .footer a {
              text-decoration: none;
              color: black
          }
  
          .footer span {
              margin: 0 2px;
          }
  
          .header h4 {
              margin-left: 30px;
              margin-right: 30px;
              line-height: 1.3;
              color: blue;
          }
  
          .content {
              padding: 10px;
              display: flex;
          }
  
          .content-item {
              width: 100%;
              max-width: 400px;
              margin: 10px;
              /* display: flex; */
          }
  
  
          .content-item h5 {
              margin: 0;
              font-size: 14px;
          }
  
          .content-item p {
              /* margin: 0; */
              font-size: 14px;
              /* margin: 10px; */
              clear: both;
              overflow: auto;
              margin: 20px 0;
          }
  
          h1 {
              color: #333333;
              text-align: center;
          }
  
          .button {
              display: inline-block;
              padding: 10px 20px;
              margin: 10px 0;
              background-color: #28a745;
              color: #ffffff;
              text-decoration: none;
              border-radius: 5px;
          }
  
          .icon {
              margin-right: 20px;
              width: 40px;
              height: 40px;
              vertical-align: middle;
          }
  
  
          .borderbox {
              border: 1.5px solid black;
              margin: 10px;
              font-size: 10px;
          }
  
  
  
          @media (max-width: 600px) {
  
              .content {
                  padding: 30px;
              }
  
              h1 {
                  font-size: 24px;
              }
  
              .header p {
                  margin-left: 10px;
                  margin-right: 10px;
                  font-size: 14px;
              }
  
              .content {
                  display: block;
              }
  
              .content-item {
                  width: 100%;
                  max-width: 100%;
                  margin: 10px 0 ;
                  /* display: flex; */
              }
  
              p {
                  font-size: 10px;
              }
  
              .button {
                  padding: 8px 16px;
              }
          }
      </style>
  </head>
  
  <body>
      <div class="container">
          <div style="padding: 10px 0; width:100%;">
              <a style="float:left;" class="left" href="https://www.ayatrio.com/"><img
                      src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721286553198_desktopImgSrc_ayatriologo.png"
                      alt="" width="40" height="40" /> </a>
              <a style="float:right;" href="https://www.ayatrio.com/"><img
                      src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721286553199_mobileImgSrc_addtocart.png"
                      alt="" width="40" height="40" /> </a>
          </div>
          <div class="header" style="margin-top: 50px;">
              <h1> Thanks For Shopping
                  at Ayatrio</h1>
              <h4>Order Number: ${order._id}</h4>
              <p> Hi Harsh,</p>
              <p> We have received your request for sample and will send you a shipping
                  confirmation with your & trace details as soon as your
                  order ships</p>
              <p> If any details within your order are incorrect, please send us an
                  email <a href="https://www.ayatrio.com/customerservice/contactus">Click here</a> or contact our customer
                  service
                  9836465083</p>
              <p>Your Ayatrio Team</p>
          </div>
  
          <h1 style="letter-spacing: 4px;">REQUEST SUMMARY</h1>
          <div class="content">
              <div class="content-item">
                  <h5> Delivery Address</h5>
                  <hr>
                  <p style="margin: 0 0 5px 0;">${order.address.firstName} ${order.address.lastName}</p>
                  <p style="margin: 0 0 5px 0;">${order.address.address}</p>
                  <p style="margin: 0 0 5px 0;">${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}
                  </p>
                  <p style="margin: 0 0 5px 0;">${order.address.phone}</p>
              </div>
              <div class="content-item">
                  <h5> Billing Information</h5>
                  <hr>
                  <p style="margin: 0 0 5px 0;">${order.address.firstName} ${order.address.lastName}</p>
                  <p style="margin: 0 0 5px 0;">${order.address.address}</p>
                  <p style="margin: 0 0 5px 0;">${order.address.city}, ${order.address.state}, ${order.address.postalCode}, ${order.address.country}
                  </p>
                  <p style="margin: 0 0 5px 0;">${order.address.phone}</p>
              </div>
              <div class="content-item">
                  <h5> Order Summary</h5>
                  <hr>
                  <p><span style="float:left;">Delivery</span> <span style="float:right;">
                          ${order.amount.deliveryPrice}.00</span></p>
                  <p style="margin-bottom: 0; font-size:20px; font-weight:bold;"><span style="float:left;">Total</span> <span style="float:right;">
                          ${order.amount.totalPrice}.00</span></p>
                  <span style="font-size: 10px;">(Inclusive of tax)</span>
              </div>
          </div>
          <h1 style="letter-spacing: 4px;">WHAT YOU REQUESTED</h1>
          <div style="width: 100%; display: block;">
              ${productHtml}
          </div>
  
          <div <div class="footer">
              <a href="https://www.ayatrio.com/"> <img
                      src="https://ayatrio-bucket.s3.ap-south-1.amazonaws.com/1721230124360_subCategoriesImage_ayatriologotext.png"
                      alt="Group 1" /> </a>
              <h4>
                  <a href="https://www.ayatrio.com/Wallpaper/category/all"><span>Wallpaper</span></a>
                  <span> &#x2022;</span>
                  <a href="https://www.ayatrio.com/flooring/category/all"><span>Flooring</span></a>
                  <span> &#x2022;</span>
                  <a href="https://www.ayatrio.com/curtain/category/all"><span>Curtain</span></a>
                  <span> &#x2022;</span>
                  <a href="https://www.ayatrio.com/blinds/category/all"><span>Blinds</span></a>
              </h4>
          </div>
      </div>
  </body>
  
  </html>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

exports.sendEmailToUser = sendEmailToUser;
exports.sendEmailForProductRequest = sendEmailForProductRequest;
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
exports.sendFreeSampleRequestEmail = sendFreeSampleRequestEmail;
