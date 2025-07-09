const axios = require("axios");
const { IG_USER_ACCESS_TOKEN } = require("../../config/instagram");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const HashtagPost = require("../../model/HashtagPost");
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

exports.createHashtagPost = async (req, res) => {
  try {
    const { 
      id,
      mediaUrl,
      username,
      postUrl,
      products,
      categoryId,
      categoryName,
      caption
    } = req.body;

    console.log("Request body:", req.body);

    // Validate required fields
    const requiredFields = ['id', 'mediaUrl', 'postUrl', 'categoryId', 'categoryName'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    // Check for existing post
    const existingPost = await HashtagPost.findOne({ id });
    if (existingPost) {
      return res.status(409).json({ message: "Post with this ID already exists" });
    }

    try {
      // Fetch image from Instagram
      const mediaResponse = await axios({
        method: "get",
        url: mediaUrl,
        responseType: "arraybuffer",
        timeout: 10000
      });

      // Process image and upload to S3
      const contentType = mediaResponse.headers["content-type"] || "image/jpeg";
      const fileExtension = contentType.split("/")[1] || "jpg";
      const sanitizedUsername = (username || "user").replace(/[^a-z0-9]/gi, '_');
      const fileName = `instagram/${sanitizedUsername}_${uuidv4()}.${fileExtension}`;

      const uploadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: Buffer.from(mediaResponse.data),
        ContentType: contentType,
        ACL: "public-read",
      };

      await s3Client.send(new PutObjectCommand(uploadParams));
      const s3Url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

      // Create post with both URLs
      const hashtagPost = new HashtagPost({
        id,
        username: username || "instagram_user",
        mediaUrl, // Original Instagram URL
        s3MediaUrl: s3Url, // New S3 URL
        postUrl,
        products,
        categoryId,
        categoryName,
        caption: caption || ""
      });

      await hashtagPost.save();

      return res.status(201).json({
        message: "Hashtag post added successfully with S3-hosted image!",
        s3MediaUrl: s3Url,
        postDetails: hashtagPost,
      });

    } catch (uploadError) {
      console.error("S3 Upload Error:", uploadError);
      const errorMessage = uploadError.response?.status === 404 
        ? "Instagram media URL not found" 
        : "Failed to upload media to S3";

      return res.status(422).json({
        message: errorMessage,
        error: uploadError.message,
      });
    }

  } catch (error) {
    console.error("Server Error:", error.message);
    return res.status(500).json({ 
      message: "Internal Server Error",
      error: error.message 
    });
  }
};

exports.getHashtagPosts = async (req, res) => {
  try {
    const info = await HashtagPost.find().populate({
      path: "products",
      model: "products",
      localField: "products",
      foreignField: "patternNumber",
    });

    res.status(200).json(info);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
};

// GET: '/api/hashtagPost/:id'
exports.getHashtagPostById = async (req, res) => {
  const { id } = req.params;

  try {
    const info = await HashtagPost.findOne({ id: id }).populate({
      path: "products",
      model: "products",
      localField: "products",
      foreignField: "patternNumber",
    });

    res.status(200).json(info);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE: '/api/hashtagpost/:id'

exports.deleteHashtagPost = async (req, res) => {
  const { id } = req.params;
  try {
    // First find the post to get the S3 URL before deletion
    const post = await HashtagPost.findOne({ id: id });

    if (!post) {
      return res.status(404).json({ message: "Hashtag post not found" });
    }

    // Check if post has an S3 image URL
    if (post.mediaUrl && post.mediaUrl.includes("amazonaws.com")) {
      try {
        // Extract the file key from the URL
        const mediaUrl = new URL(post.mediaUrl);
        const key = mediaUrl.pathname.substring(1); // Remove leading slash

        // Set up S3 delete parameters
        const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        };

        // Delete file from S3
        const command = new DeleteObjectCommand(params);
        await s3Client.send(command);
        console.log(`Deleted image from S3: ${key}`);
      } catch (s3Error) {
        // Log error but continue with post deletion
        console.error("Error deleting image from S3:", s3Error);
      }
    }

    // Delete the post from MongoDB
    await HashtagPost.findOneAndDelete({ id: id });

    res.status(200).json({
      message: "Hashtag post and associated image deleted successfully!",
    });
  } catch (error) {
    console.error("Error in deleteHashtagPost:", error);
    res.status(500).json({ message: error.message });
  }
};

// Patch: '/api/hashtagPost/:id'

//why use patch here instead of post

exports.updateHashtagPost = async (req, res) => {
  const { id } = req.params;
  const { products, categoryId, username } = req.body;

  try {
    await HashtagPost.findOneAndUpdate(
      { id: id },
      {
        products,
        username,
        category: categoryId,
      }
    );
    res.status(200).json({ message: "Hashtag post updated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//when will this be used

// Fetch posts from Instagram API and save to database
exports.fetchAndSaveFromAPI = async (req, res) => {
  try {
    const accessToken = process.env.IG_USER_ACCESS_TOKEN; // From .env
    const instagramUserId = "17841407828748565"; // Your verified ID
    const fields = "id,caption,media_url,permalink,media_type,username";

    // 1. Get Instagram posts
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${instagramUserId}/media`,
      {
        params: {
          fields,
          access_token: accessToken
        }
      }
    );

    // 2. Process posts
    const posts = response.data.data || [];
    let savedCount = 0;

    for (const post of posts) {
      const exists = await HashtagPost.findOne({ id: post.id });
      if (exists) continue;

      // 3. Download and upload to S3
      const mediaResponse = await axios.get(post.media_url, {
        responseType: 'arraybuffer'
      });
      
      const fileName = `instagram/${post.id}.${post.media_type === 'VIDEO' ? 'mp4' : 'jpg'}`;
      
      await s3Client.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: fileName,
        Body: mediaResponse.data,
        ContentType: mediaResponse.headers['content-type'],
        ACL: 'public-read'
      }));

      // 4. Save to database
      const newPost = new HashtagPost({
        id: post.id,
        username: post.username,
        mediaUrl: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`,
        postUrl: post.permalink,
        mediaType: post.media_type,
        caption: post.caption
      });

      await newPost.save();
      savedCount++;
    }

    res.status(200).json({
      success: true,
      message: `${savedCount} new posts saved`,
      total: posts.length
    });

  } catch (error) {
    console.error("Full Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data?.error || error.message
    });
  }
};

exports.getInstagramPosts = async (req, res) => {
  try {
    const accessToken = process.env.IG_USER_ACCESS_TOKEN;
    const instagramApiUrl = `https://graph.facebook.com/v20.0/18008984500097700/top_media?user_id=17841407828748565&fields=id,username,caption,children,like_count,permalink,media_url,media_product_type&access_token=${accessToken}`;

    const response = await axios.get(instagramApiUrl);
    const posts = response.data.data || [];

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching Instagram posts",
      error: error.message,
    });
  }
};