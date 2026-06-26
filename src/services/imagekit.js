import { ImageKit } from "@imagekit/nodejs";

const imagekit = new ImageKit({
    publicKey: process.env.PUBLIC_KEY,
    privateKey: process.env.PRIVATE_KEY,
    urlEndpoint: process.env.IMAGE_URL,
});

export default imagekit;