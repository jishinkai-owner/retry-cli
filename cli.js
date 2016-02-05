const retry = require('retry');
const spawn = require('child_process').spawn;
const Getopt = require('node-getopt');

getopt = new Getopt([
  ['n', 'retries=ARG', 'The maximum amount of times to retry the operation. Default is 10.'],
  ['', 'factor=ARG', 'The exponential factor to use. Default is 2.'],
  ['t', 'min-timeout=ARG', 'The number of milliseconds before starting the first retry. Default is 1000.'],
  ['', 'max-timeout=ARG', 'The maximum number of milliseconds between two retries. Default is Infinity.'],
  ['', 'randomize', 'Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is false.'],
  ['h', 'help', 'display this help.']
]);

getopt.setHelp(
  "Usage: retry [OPTION] -- [COMMAND]\n" +
  "\n" +
  "[[OPTIONS]]\n" +
  "Examples:\n" +
  "retry -- ls -lah"
);

const opt = getopt.parse(process.argv);

console.info(opt);

const cmd = opt.argv.slice(2);

if (!cmd[0]) {
  getopt.showHelp();
  return;
}

operation = retry.operation({
  retries: opt.options['retries'] || 10,
  factor: opt.options['factor'] || 2,
  minTimeout: opt.options['min-timeout'] || 1000,
  maxTimeout: opt.options['max-timeout'] || Infinity,
  randomize: opt.options['randomize'] || false
});
operation.attempt(function (currentAttempt) {
  const ls = spawn(cmd[0], cmd.slice(1), {stdio: 'inherit'});

  ls.on('exit', (code, signal) => {
    if (code != 0) {
      operation.retry(true);
    }
  });

  ls.on('error', (err) => {
    operation.retry(err);
  });
});