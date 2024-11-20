import { Router } from "express";
import {
  createTweet,
  deleteTweet,
  getUsertweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);
router.route("/user/:userId").get(getUsertweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
