const vision = require('@google-cloud/vision');

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

async function verifySingleFace(filePath) {
  const [result] = await client.faceDetection(filePath);
  const faces = result.faceAnnotations;

  if (!faces.length) {
    throw new Error('לא נמצאה אף פנים בתמונה');
  }
  if (faces.length > 1) {
    throw new Error('נמצאו יותר מפנים אחת בתמונה');
  }

  return true;
}

module.exports = { verifySingleFace };
