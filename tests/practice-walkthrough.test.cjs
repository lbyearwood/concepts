const {test}=require('node:test');
const assert=require('node:assert/strict');
const exam=require('../data/programming-problems.json');
const practice=require('../data/practice-problems.json').problems;
const guides=require('../data/practice-tutorial-guides.json').problems;
const {walkthroughFrames,checkpointLimit,tutorialCodeLines}=require('../assets/tutorial-typewriter.js');
const {collectionProblems,createProblemSession}=require('../assets/programming-problems.js');

test('Easy has ten problems per interest and cannot leak into Exam, Medium, Hard or another category',()=>{
  const data={...exam,practiceProblems:practice};
  for(const c of exam.practiceCategories){
    const group=collectionProblems(data,'level1',c.id);
    assert.equal(group.length,10);
    assert.deepEqual(group.map(p=>p.id),Array.from({length:10},(_,i)=>'easy-'+c.id+'-'+String(i+1).padStart(2,'0')));
    assert.equal(collectionProblems(data,'level2',c.id).length,0);
    assert.equal(collectionProblems(data,'level3',c.id).length,0);
  }
  assert.equal(collectionProblems(data,'exam','sql').length,7);
  const session=createProblemSession([...exam.problems,...practice,{...practice[0],id:'future-medium',collection:'level2'}]);
  for(const c of exam.practiceCategories){
    const group=collectionProblems(data,'level1',c.id);
    assert.equal(session.neighbour(group[0].id,-1),null);
    assert.equal(session.neighbour(group[9].id,1),null);
    assert.equal(session.neighbour(group[0].id,1).id,group[1].id);
  }
  session.save(practice[0].id,{line:2,checkpoint:practice[0].id+'-check-2'});
  session.save(practice[1].id,{line:1});
  assert.equal(session.get(practice[0].id).line,2);
  session.clear();assert.equal(session.get(practice[0].id),null);
});

for(const p of practice)test(p.id+' retains exact code and independent checkpoints before every forward route',()=>{
  const guide=guides[p.id],lines=tutorialCodeLines(p,guide);
  assert.equal(lines.map(l=>l.text).join('\n'),p.solution);
  for(const compact of [false,true]){
    const frames=walkthroughFrames(p,guide,compact),correct=new Set();
    const checks=frames.filter(f=>f.checkpoint);
    assert.equal(checks.length,4);
    assert.equal(new Set(checks.map(f=>f.checkpoint)).size,4);
    for(const frame of checks){
      const at=frames.indexOf(frame);
      assert.equal(checkpointLimit(frames,id=>correct.has(id)),at);
      if(frame.kind==='prediction'){
        assert.ok(frames.slice(at+1).find(f=>f.line>frame.line),'Prediction must withhold later code');
        assert.ok(!frames.slice(0,at).some(f=>f.line>frame.line));
      }
      correct.add(frame.checkpoint);
    }
    assert.equal(checkpointLimit(frames,id=>correct.has(id)),frames.length-1);
    correct.delete(checks[0].checkpoint);
    assert.equal(checkpointLimit(frames,id=>correct.has(id)),frames.indexOf(checks[0]),'Changing to a wrong answer relocks every later route');
    correct.clear();assert.equal(checkpointLimit(frames,id=>correct.has(id)),frames.indexOf(checks[0]));
  }
});
