const {test}=require('node:test');
const assert=require('node:assert/strict');
const data=require('../data/programming-problems.json');
const guides=require('../data/tutorial-guides.json').problems;
const {tutorialCodeLines,walkthroughFrames,checkpointLimit,frameStep}=require('../assets/tutorial-typewriter.js');
for(const problem of data.problems) test(problem.id+' exact cumulative solution, original stages and all forward checkpoints',()=>{
  const guide=guides[problem.id], lines=tutorialCodeLines(problem,guide);
  assert.equal(lines.map(l=>l.text).join('\n'),problem.solution);
  for(const compact of [false,true]){
    const frames=walkthroughFrames(problem,guide,compact), passed=new Set();
    const limit=()=>checkpointLimit(frames,id=>passed.has(id));
    const checks=frames.map((f,index)=>({...f,index})).filter(f=>f.checkpoint);
    assert.equal(new Set(checks.map(f=>f.checkpoint)).size,checks.length);
    const stages=problem.steps.map((_,s)=>frames.findIndex(f=>frameStep(f,lines)===s));
    stages.forEach(target=>assert.ok(target>=0,'original stage must remain reachable'));
    const explain=frames.filter(f=>f.kind==='explanation');
    assert.deepEqual(explain.map(f=>f.line),lines.map((_,i)=>i));
    for(const check of checks){
      assert.equal(limit(),check.index);
      for(const target of stages.filter(t=>t>check.index)) assert.ok(target>limit(),'later stages stay locked');
      assert.ok(check.index+1>limit(),'Next stays locked');
      if(check.kind==='prediction'){
        const nextLine=frames.findIndex((f,i)=>i>check.index && f.line>check.line);
        assert.ok(nextLine>limit(),'next code/explanation is beyond the gate');
        assert.ok(frames.slice(0,limit()+1).every(f=>f.line<=check.line));
      }
      passed.add(check.checkpoint);
      assert.ok(limit()>=check.index);
      passed.delete(check.checkpoint);assert.equal(limit(),check.index,'wrong-again relocks');
      passed.add(check.checkpoint);
    }
    assert.equal(limit(),frames.length-1);
    passed.clear();assert.equal(limit(),checks[0].index,'new attempt resets every gate');
    if(guide.stageReviews)assert.deepEqual(frames.filter(f=>f.kind==='review').map(f=>f.step),problem.steps.map((_,i)=>i));
  }
});
