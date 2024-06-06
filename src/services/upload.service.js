"user strict"

const cloudinary = require("../dbs/init.cloudinary");
const CONSTANT = require('../helpers/constants');

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

            return {
                code: 200,
                metadata: {
                    avt_url: uploadImage.url,
                    avt_thumb_url,
                    user_id: user_id,
                    type: type,
                }
            }
        }
        catch (error) {
            throw new Error(error)
        }
       
    }
}

module.exports = new UploadService();