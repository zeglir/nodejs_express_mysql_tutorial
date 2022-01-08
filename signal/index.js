const PID = process.argv[2];

if (PID) {
  process.kill(PID, "SIGINT");
}
