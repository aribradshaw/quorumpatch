const cases = [
  ['partial-retry', async deliver => {
    const ledger = {}; const calls = []; let reject = true;
    const items = [{id:'A'},{id:'B'}];
    const send = async item => { calls.push(item.id); return item.id === 'B' && reject ? {status:'rejected'} : {status:'accepted',receipt:'r-'+item.id}; };
    const first = await deliver(items,ledger,send); const retained = ledger.A?.receipt === 'r-A';
    reject = false; const second = await deliver(items,ledger,send);
    return [first.status,retained,second.status,calls.join(','),ledger.B?.receipt];
  }, ['incomplete',true,'complete','A,B,B','r-B']],
  ['unknown-is-not-retried', async deliver => {
    const ledger = {}; const calls = []; const items = [{id:'A'},{id:'B'},{id:'C'}];
    const send = async item => { calls.push(item.id); if(item.id==='B') throw Error('uncertain'); return {status:'accepted',receipt:'r-'+item.id}; };
    const a = await deliver(items,ledger,send); const b = await deliver(items,ledger,send);
    return [a.status,b.status,ledger.B?.status,calls.join(',')];
  }, ['incomplete','incomplete','unknown','A,B']],
  ['missing-receipt-is-unknown', async deliver => {
    const ledger = {}; let calls=0; const send=async()=>{calls++;return {status:'accepted'};};
    const a=await deliver([{id:'A'}],ledger,send); const b=await deliver([{id:'A'}],ledger,send);
    return [a.status,b.status,ledger.A?.status,calls];
  }, ['incomplete','incomplete','unknown',1]],
  ['unrecognized-response', async deliver => {
    const ledger={}; let calls=0; const send=async()=>{calls++;return null;};
    const a=await deliver([{id:'A'}],ledger,send); const b=await deliver([{id:'A'}],ledger,send);
    return [a.status,b.status,ledger.A?.status,calls];
  }, ['incomplete','incomplete','unknown',1]],
  ['preexisting-malformed-entry', async deliver => {
    const ledger={A:{status:'accepted',receipt:''}};let calls=0;
    const a=await deliver([{id:'A'}],ledger,async()=>{calls++;return {status:'accepted',receipt:'new'};});
    return [a.status,calls];
  }, ['incomplete',0]],
  ['accepted-and-unrelated-preserved', async deliver => {
    const ledger={A:{status:'accepted',receipt:'old'},X:{status:'unknown'}};let calls=0;
    const items=Object.freeze([Object.freeze({id:'A'}),Object.freeze({id:'B'})]);
    const a=await deliver(items,ledger,async()=>{calls++;return {status:'accepted',receipt:'new'};});
    return [a.status,calls,ledger.A.receipt,ledger.X.status];
  }, ['complete',1,'old','unknown']],
  ['empty-batch', async deliver => [ (await deliver([],{},async()=>{throw Error('must not send');})).status ], ['complete']],
];
module.exports = { cases };
if (require.main === module) (async()=>{
  const {deliver}=require(process.argv[2]);
  const selected=process.argv.includes('--repro')?cases.slice(0,1):cases;
  const checks=[];
  for(const [id,run,expected] of selected){let actual;try{actual=await run(deliver);}catch{actual={error:'candidate-threw'};}checks.push({id,expected,actual,pass:JSON.stringify(actual)===JSON.stringify(expected)});}
  console.log(JSON.stringify({protocol:1,checks}));process.exitCode=checks.every(c=>c.pass)?0:1;
})();
