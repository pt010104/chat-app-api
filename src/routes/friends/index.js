"use strict";

const express = require("express");
const router = express.Router();
const { asyncHandler } = require("../../helpers/asyncHandler");
const FriendshipController = require("../../controllers/friendship.controller");
const { authentication } = require("../../auth/authUtils");

router.use(authentication);

router.get("/list/all", asyncHandler(FriendshipController.listFriends));
router.get("/list/requests", asyncHandler(FriendshipController.listRequestsFriends));
router.post("/send-request", asyncHandler(FriendshipController.sendFriendRequest));
router.post("/accept-request", asyncHandler(FriendshipController.acceptFriendRequest));
router.post("/cancel-request", asyncHandler(FriendshipController.cancelFriendRequest));
router.post("/search-friend", asyncHandler(FriendshipController.searchFriend));
router.post("/remove-friend", asyncHandler(FriendshipController.removeFriend));
router.post("/deny-request", asyncHandler(FriendshipController.denyFriendRequest));
module.exports = router;
