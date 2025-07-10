// listModels.js
require('dotenv').config();
const { ClarifaiStub, grpc } = require('clarifai-nodejs-grpc');

const stub = ClarifaiStub.grpc();
const metadata = new grpc.Metadata();
metadata.set('authorization', 'Key ' + process.env.CLARIFAI_API_KEY);

stub.ListModels({}, metadata, (err, res) => {
  if (err) {
    console.error('Error fetching models:', err);
    process.exit(1);
  }
  console.log('Available models (ID : Name):\n');
  res.models.forEach(m => {
    console.log(` • ${m.id} : ${m.name}`);
  });
  process.exit(0);
});
