import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { ApiError } from "../utile/apierror.js";
import { ApiResponse } from "../utile/apiresponse.js";
import { asyncHandler } from "../utile/asynchandler.js";

import {
  uploadOnCloudinary,
  deleteFileFromCloudinary,
} from "../utile/cloudynary.js";
import { Video } from "../models/video.models.js";
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.body;
  //get all videos based on query , sort , pagination
  if (page <= 0 || limit <= 0) {
    throw new ApiError(400, "page and limit must be positive");
  }
  if (userId && !isValidObjectId(userId)) {
    throw new ApiError(400, "invalid userId");
  }
  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }
  if (userId) {
    filter.userId = userId;
  }

  const sortOrder = sortType == "asc" ? 1 : -1;
  const sortCriteria = { [sortBy]: sortOrder };

  const skip = (page - 1) * limit;

  const videos = await video
    .find(filter)
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit);

  const totalVideos = await video.countDocuments(filter);

  res.status(200).json(
    new ApiResponse({
      data: videos,
      pagination: {
        total: totalVideos,
        page,
        limit,
        totalPages: Math.ceil(totalVideos / limit),
      },
    })
  );
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "title and description are required");
  }
  console.log(req.files);
  const videoFilePath = req?.files?.videoFile[0].path;
  if (!videoFilePath) throw new ApiError(404, "video is required");
  const FilePath = await cloudinary.uploader.upload(videoFilePath);
  if (!FilePath && FilePath.url)
    throw new ApiError(404, "video is not uploaded");
  const video = await Video.create({
    videoFile: FilePath.url || "",
    thumbnail: "",
    title,
    description,
    owner: req.user._id,
  });
  if (!video) throw new ApiError(500, "error creating video");
  return res
    .status(201)
    .json(new ApiResponse(201, video, "video uploaded succesfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //get video by id
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  res.status(200).json({
    message: "video found successfully",
  });
});
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //delete video
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  const { title, description } = req.body;
  video.title = title;
  video.description = description;
  await video.save();
  res.status(200).json({
    message: "video updated successfully",
  });
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //delete video
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "video not found");
    }
    if (video.cloudinaryId) {
      await deleteFileFromCloudinary(video.cloudinaryId);
    }
    await video.remove();
  } catch (error) {
    console.log(error, "error while deleting video");
  }

  return res.status(200).json({
    message: "video deleted successfully",
  });
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  video.isPublished = !video.isPublished;
  await video.save();
  return res.status(200).json({
    message: "toggled publish status successfully",
  });
});

export {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
