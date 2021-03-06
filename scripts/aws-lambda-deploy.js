const exec = require('child_process').exec;
const read = require('fs').readFileSync;
const AWS = require('aws-sdk');
const Promise = require('bluebird');

const hello-world-lambda = process.argv[2];
if (!hello-world-lambda) {
  console.error('Error: missing lambda name.');
  process.exit(1);
}

const lambda = new AWS.Lambda({
  region: 'us-east-1'
});

const lambdaUpdateFunctionCode = Promise.promisify(lambda.updateFunctionCode.bind(lambda));
const execCommand = Promise.promisify(exec);

const cwd = process.cwd();
const zipLambdaCommand = `
  cd ${cwd}/lambda/${hello-world-lambda}/ &&
  npm install --production &&
  zip -r ${hello-world-lambda}.zip * --quiet`;

execCommand(zipLambdaCommand)
.then(() => {
  const lambdaUpdateFunctionCodeParams = {
    FunctionName: `${hello-world-lambda}`,
    Publish: true,
    ZipFile: read(`${cwd}/lambda/${hello-world-lambda}/${hello-world-lambda}.zip`)
  };
  console.log('Uploading code to lambda with params:', lambdaUpdateFunctionCodeParams);
  return lambdaUpdateFunctionCode(lambdaUpdateFunctionCodeParams);
})
.then(lambdaData => {
  const lambdaVersion = lambdaData.Version;
  console.log('Lambda code uploaded with version', lambdaVersion);
  console.log('Deployment done');
  return;
})
.catch(error => {
  throw new Error(`Error while executing deployment script: ${error}`);
});