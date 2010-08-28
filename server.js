process.title = 'unsaving-daiva';
process.addListener('uncaughtException', function (err, stack) {
  console.log('Caught exception: ' + err);
  console.log(err.stack.split('\n'));
});

require.paths.push('/home/node/.node_libraries');
require("./app");