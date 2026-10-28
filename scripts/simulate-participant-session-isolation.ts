import { runTwoParticipantIsolationScenario } from '../lib/assessmentSessionScenario';

const checks = runTwoParticipantIsolationScenario();
let failed = 0;
for (const check of checks) {
  const mark = check.ok ? 'PASS' : 'FAIL';
  if (!check.ok) failed += 1;
  console.log(`${mark}  ${check.name}  (${check.detail})`);
}
if (failed > 0) {
  console.error(`\n${failed} check(s) failed. Tab A can still affect tab B.`);
  process.exit(1);
}
console.log('\nTwo participants in one browser stay isolated.');
