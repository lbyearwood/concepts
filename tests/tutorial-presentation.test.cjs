const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderDatabaseTable,createCompletion}=require('../assets/tutorial-presentation.js');
const {lineCheckpoints,walkthroughFrames}=require('../assets/tutorial-typewriter.js');
const data=require('../data/programming-problems.json');
const guides=require('../data/tutorial-guides.json').problems;

function harness(reduced=false){
  class Node{
    constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.hidden=true;this.value='';this.clientHeight=500;this.classes=new Set();this.classList={toggle:(name,on)=>on?this.classes.add(name):this.classes.delete(name)};this.style={values:{},setProperty(name,value){this.values[name]=value;}};}
    append(...nodes){this.children.push(...nodes);}
    replaceChildren(...nodes){this.children=[...nodes];}
    setAttribute(key,value){this.attributes[key]=value;}
    set textContent(value){this.value=value;this.children=[];}
    get textContent(){return this.value+this.children.map(n=>n.textContent).join('');}
  }
  global.document={createElement:tag=>new Node(tag)};
  const badge=new Node('p'),overlay=new Node('div'),next=new Node('button'),label=new Node('span'),timers=new Map();let serial=0;
  const completion=createCompletion({badge,overlay,next,label,reducedMotion:()=>reduced,random:()=>.5,
    schedule:callback=>{timers.set(++serial,callback);return serial;},unschedule:id=>timers.delete(id)});
  return {badge,overlay,next,label,timers,completion,cleanup(){delete global.document;}};
}

test('database examples use real table headers and cells and preserve every value as text',()=>{
  const h=harness();
  try{
    for(const problem of data.problems.filter(p=>p.language==='sql')){
      const table=renderDatabaseTable(problem.database),[caption,head,body]=table.children;
      assert.equal(table.tagName,'table');assert.equal(caption.textContent,problem.database.table);
      assert.deepEqual(head.children[0].children.map(c=>[c.tagName,c.attributes.scope,c.textContent]),problem.database.columns.map(c=>['th','col',c.name]));
      assert.deepEqual(body.children.map(row=>row.children.map(c=>c.textContent)),problem.database.rows.map(row=>row.map(String)));
      assert.ok(body.children.every(row=>row.children.every(c=>c.tagName==='td')));
      assert.equal(problem.question.givenCode,undefined,'SQL data must not duplicate a pipe-delimited text table');
    }
    const table=renderDatabaseTable({table:'Example',columns:[{name:'Text'}],rows:[['<img src=x onerror=alert(1)>']]});
    assert.equal(table.children[2].children[0].children[0].textContent,'<img src=x onerror=alert(1)>');
  }finally{h.cleanup();}
});

test('completion is shown only at a fully passed final view and confetti runs once per problem per attempt',()=>{
  const h=harness(),status={problemId:'problem-58',atEnd:true,allCorrect:false,visible:true,count:4};
  try{
    assert.equal(h.completion.update(status),false);assert.equal(h.badge.hidden,true);assert.equal(h.overlay.children.length,0);
    assert.equal(h.completion.update({...status,allCorrect:true,atEnd:false}),false);
    assert.equal(h.completion.update({...status,allCorrect:true,visible:false}),false);
    assert.equal(h.completion.update({...status,allCorrect:true}),true);
    assert.equal(h.badge.textContent,'✓ Tutorial complete');assert.equal(h.label.textContent,'Completed');assert.equal(h.overlay.children.length,48);assert.equal(h.timers.size,1);
    h.completion.update({...status,allCorrect:true});assert.equal(h.timers.size,1,'a rerender must not queue another drop');
    h.completion.stop();assert.equal(h.overlay.hidden,true);assert.equal(h.timers.size,0);
    h.completion.update({...status,allCorrect:true});assert.equal(h.overlay.children.length,0,'restoring a completed view must not replay confetti');
    h.completion.update(status);assert.equal(h.badge.hidden,true,'a wrong answer removes the completion status');
    h.completion.reset();h.completion.update({...status,allCorrect:true});assert.equal(h.overlay.children.length,48,'Close resets the attempt');
    [...h.timers.values()][0]();assert.equal(h.overlay.children.length,0);assert.equal(h.overlay.hidden,true);
  }finally{h.cleanup();}
});

test('reduced motion retains the completion message without falling pieces or a timer',()=>{
  const h=harness(true);
  try{
    h.completion.update({problemId:'problem-1',atEnd:true,allCorrect:true,visible:true,count:7});
    assert.equal(h.badge.hidden,false);assert.equal(h.overlay.hidden,true);assert.equal(h.overlay.children.length,0);assert.equal(h.timers.size,0);
  }finally{h.cleanup();}
});

test('SQL clauses stay on single physical lines without losing the original checkpoints',()=>{
  assert.equal(data.problems.find(p=>p.id==='problem-58').solution.split('\n')[0],'SELECT Name, YearGroup');
  for(const problem of data.problems.filter(p=>p.language==='sql')){
    assert.ok(problem.solution.split('\n').every(line=>/^(SELECT|FROM|WHERE|ORDER BY)\b/.test(line)));
    const guide=guides[problem.id],checks=guide.lines.flatMap(lineCheckpoints);
    assert.equal(checks.filter(q=>q.kind==='question').length,3);
    const frames=walkthroughFrames(problem,guide);
    assert.deepEqual(frames.filter(f=>f.checkpoint).map(f=>f.checkpoint),checks.map(q=>q.question.id));
  }
});
