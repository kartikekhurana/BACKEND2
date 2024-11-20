import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utile/apierror.js";
import { ApiResponse } from "../utile/apiresponse.js";
import { asyncHandler } from "../utile/asynchandler.js";
const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const tweet = await Tweet.create({
    content,
    user: req.user._id,
  });
  if (!tweet) {
    throw new ApiError(404, "tweet  not created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "tweet created succesfully"));
});
const getUsertweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (userId && !isValidObjectId(userId)) {
    throw new ApiError(400, "invalid user id");
  }
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullname: 1,
              avatar: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $$addFields: {
        owner: { $arrayElemAt: ["$owner", 0] },
      },
    },
  ]);
  return res.status(200, json(new ApiResponse(200, tweets, "user tweets")));
});

const updateTweet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const tweet = await Tweet.findById(req.params.tweetId);
  if (!tweet) {
    throw new ApiError(404, "tweet not found");
  }
  if (tweet.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "you are not the owner of this tweet");
  }
  tweet.content = req.body.content;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const tweet = await Tweet.findById(req.params.tweetId);

  if (tweet.owner.toString() !== user._id.toString()) {
    throw new ApiError(403, "you are not the owner of this tweet");
  }
  await Tweet.findByIdAndDelete(req.params.tweetId);

  return res.status(200).json(new ApiResponse(200, {}, "tweet is deleted"));
});

export { createTweet, getUsertweets, updateTweet, deleteTweet };
