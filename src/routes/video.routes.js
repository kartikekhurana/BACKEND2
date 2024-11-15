import { Router } from "express";
import {
  getAllVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.use(verifyJWT);

router.route("/").get(verifyJWT, getAllVideos);
router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);


router
.route('/:vidoeId')
.get(verifyJWT,getVideoById)
.delete(verifyJWT,deleteVideo)
.patch(upload.single("thumbnail"),updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT,togglePublishStatus);

export default router;