"user strict"

const cloudinary = require("../dbs/init.cloudinary");
const CONSTANT = require('../helpers/constants');
const User = require("../models/user.model");
const { Readable } = require('stream'); 
const RedisService = require("./redis.service");
const ProfileService = require("./profile.service");
const { BadRequestError } = require("../core/error.response");

class UploadService {
    uploadImageFromLocal = async ({
        path,
        user_id,
        type = "avatar",
    }) => {
        try {
            let folderName = type + "/" + user_id;

            const uploadImage = await cloudinary.uploader.upload(path, {
                public_id: `${user_id}_${Date.now()}`, 
                folder: folderName,
            })
            let url = {};

            if (type == "avatar") {
                const avt_url = await cloudinary.url(uploadImage.public_id, {
                    width: CONSTANT.WIDTH_AVATAR,
                    height: CONSTANT.HEIGHT_AVATAR,
                    crop: "fill",
                    format: 'jpg'
                })
                const avt_thumb_url = await cloudinary.url(uploadImage.public_id, {
                    width: CONSTANT.WIDTH_THUMB_AVATAR,
                    height: CONSTANT.HEIGHT_THUMB_AVATAR,
                    crop: "fill",
                    format: 'jpg'
                })
                url['avt_url'] = avt_url;
                url['avt_thumb_url'] = avt_thumb_url;

                const uploadAvt = await User.updateOne(
                    { _id: user_id }, 
                    {
                        '$set': {
                            avatar: avt_url,
                            thumb_avatar: avt_thumb_url
                        }
                    }, 
                    {
                        upsert: true,
                        runValidators: true,
                    }
                );                
            }
           
            return {
                url,
                user_id: user_id,
                type: type,
            }
        }
        catch (error) {
            throw new Error(error)
        }
       
    }

    uploadImageFromBuffer = async ({ buffer, user_id, params}) => {
        try {
            let folderName
            let publicIDBase
            const { type } = params || "avatar";

            if (type === "avatar") {
                folderName = type + "/" + user_id;
                publicIDBase = user_id;
            } else if (type === "room") {
                folderName = type  + "/" + params.room_id;
                publicIDBase = params.room_id;
            } else if (type === "message") {
                folderName = type + "/" + params.room_id;
                publicIDBase = params.room_id;
            } else {
                throw new BadRequestError("Invalid type");
            }
    
            const uploadImagePromise = new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        public_id: `${publicIDBase}_${Date.now()}`,
                        folder: folderName,
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
    
                const readableStream = new Readable();
                readableStream.push(buffer);
                readableStream.push(null);
                readableStream.pipe(uploadStream);
            });
    
            const uploadImage = await uploadImagePromise;
    
            if (type === "avatar") {
                const generateUrls = () => {
                    const avt_url = cloudinary.url(uploadImage.public_id, {
                        width: CONSTANT.WIDTH_AVATAR,
                        height: CONSTANT.HEIGHT_AVATAR,
                        crop: "fill",
                        format: 'jpg'
                    });
                    const avt_thumb_url = cloudinary.url(uploadImage.public_id, {
                        width: CONSTANT.WIDTH_THUMB_AVATAR,
                        height: CONSTANT.HEIGHT_THUMB_AVATAR,
                        crop: "fill",
                        format: 'jpg'
                    });
                    return { avt_url, avt_thumb_url };
                };
    
                const { avt_url, avt_thumb_url } = generateUrls();
    
                await Promise.all([
                    ProfileService.updateInfo(user_id, {
                        avatar: avt_url,
                        thumb_avatar: avt_thumb_url
                    })
                ]);
    
                return { avt_url, avt_thumb_url };
            }

            if (type === "room") {
                const generateUrls = () => {
                    const room_url = cloudinary.url(uploadImage.public_id, {
                        width: CONSTANT.WIDTH_AVATAR,
                        height: CONSTANT.HEIGHT_AVATAR,
                        crop: "fill",
                        format: 'jpg'
                    });
                    return { room_url };
                };

                const { room_url } = generateUrls();

                return { room_url };
            } 

            if (type === "message") {
                const generateUrls = () => {
                    const url = cloudinary.url(uploadImage.public_id, {
                        width: CONSTANT.WIDTH_AVATAR,
                        height: CONSTANT.HEIGHT_AVATAR,
                        crop: "fill",
                        format: 'jpg'
                    });
                    return { url };
                };

                const { url } = generateUrls();

                return { url };
            }
    
            return { url: uploadImage.url };
        } catch (error) {
            console.error(error);
            throw error;
        }
    };
}

module.exports = new UploadService();